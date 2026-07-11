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
  const { addLog, clearLogs } = useOutputStore();
  const { openOutputModal } = useWorkspaceStore();

  const run = useCallback(async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    clearLogs();
    openOutputModal('logs');
    
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
        reduce_noise: false,
        search: false
      });

      const reqId = response.request_id;
      setCurrentRequestId(reqId);
      addLog(`[INFO] Job submitted successfully. Request ID: ${reqId}`);
      addLog(`[INFO] Streaming events...`);

      await ApiClient.streamRunEvents(reqId, {
        onEvent: (event) => {
          // Dump raw event into logs for now
          addLog(JSON.stringify(event));
        },
        onError: (err) => {
          addLog(`[ERROR] Stream error: ${err.message}`);
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
      setIsRunning(false);
    }
  }, [code, language, rootNode, xVar, isRunning, addLog, clearLogs, openOutputModal]);

  const stop = useCallback(async () => {
    if (!currentRequestId) return;
    try {
      addLog(`[INFO] Requesting stop for Job ${currentRequestId}...`);
      await ApiClient.stopRunRequest(currentRequestId);
    } catch (err: any) {
      addLog(`[ERROR] Failed to stop job: ${err.message}`);
    }
  }, [currentRequestId, addLog]);

  return { run, stop, isRunning };
};
