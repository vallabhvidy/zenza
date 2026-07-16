import { useState, useCallback } from 'react';
import { ApiClient } from './client';
import { useEditorStore } from '../store/editorStore';
import { useSchemaStore } from '../store/schemaStore';
import { useOutputStore } from '../store/outputStore';
import { useWorkspaceStore } from '../store/workspaceStore';

export const useExecution = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);

  const { language, codes } = useEditorStore();
  const code = codes[language];
  const { rootNode, xVar } = useSchemaStore();
  const { addLog, clearLogs, addMetric, clearMetrics, setRunStatus } = useOutputStore();
  const { openOutputModal, reduceNoise } = useWorkspaceStore();

  const run = useCallback(async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    clearLogs();
    clearMetrics();
    setRunStatus('QUEUED');
    openOutputModal('graph');
    
    // Format node for backend (remove client-side 'id' and map 'children' to 'input')
    const formatNodeForBackend = (node: any): any => {
      const { id, ...rest } = node;
      if (rest.type === 'input') {
        return { input: rest.children.map(formatNodeForBackend) };
      }
      if (rest.type === 'repeat') {
        return { ...rest, input: formatNodeForBackend(rest.input) };
      }
      if (rest.type === 'array') {
        return { ...rest, elementType: formatNodeForBackend(rest.elementType) };
      }
      return rest;
    };

    try {
      addLog(`[INFO] Submitting job...`);
      const response = await ApiClient.submitRunRequest({
        code,
        language,
        input_schema: formatNodeForBackend(rootNode),
        x_var: formatNodeForBackend(xVar),
        reduce_noise: reduceNoise,
        search: false
      });

      const reqId = response.request_id;
      setCurrentRequestId(reqId);
      addLog(`[INFO] Job submitted successfully. Request ID: ${reqId}`);
      addLog(`[INFO] Streaming events...`);

      await ApiClient.streamRunEvents(reqId, {
        onEvent: (event: any) => {
          // Check if it's a status update event
          if (event && event.type === 'status' && event.status) {
            setRunStatus(event.status);
            addLog(`[STATUS] Job status is now: ${event.status}`);
            return;
          }

          // Dump raw event into logs
          addLog(JSON.stringify(event));
          
          // Parse and store metric if valid
          if (event && typeof event.n === 'number' && typeof event.time === 'number') {
            addMetric({
              n: event.n,
              time: event.time,
              memory: event.memory || 0,
              status: event.status || 'OK'
            });
          }
        },
        onError: (err) => {
          addLog(`[ERROR] Stream error: ${err.message}`);
          setRunStatus('FAILED');
          setIsRunning(false);
          setCurrentRequestId(null);
        },
        onComplete: () => {
          addLog(`[INFO] Stream complete.`);
          setIsRunning(false);
          setCurrentRequestId(null);
        }
      });

    } catch (err: any) {
      addLog(`[ERROR] Failed to start job: ${err.message}`);
      setRunStatus('FAILED');
      setIsRunning(false);
    }
  }, [code, language, rootNode, xVar, isRunning, addLog, clearLogs, clearMetrics, setRunStatus, openOutputModal]);

  const stop = useCallback(async () => {
    if (!currentRequestId) return;
    try {
      addLog(`[INFO] Requesting stop for Job ${currentRequestId}...`);
      await ApiClient.stopRunRequest(currentRequestId);
      setRunStatus('STOPPED');
    } catch (err: any) {
      addLog(`[ERROR] Failed to stop job: ${err.message}`);
    }
  }, [currentRequestId, addLog, setRunStatus]);

  return { run, stop, isRunning };
};
