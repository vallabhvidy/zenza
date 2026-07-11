import type { RunRequestPayload, RunResponse, StreamEvent } from './models';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export class ApiClient {
  static async submitRunRequest(payload: RunRequestPayload): Promise<RunResponse> {
    const response = await fetch(`${API_BASE_URL}/run_request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to submit request: ${response.statusText}`);
    }

    return response.json();
  }

  static async stopRunRequest(requestId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/stop/${requestId}`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to stop request: ${response.statusText}`);
    }
  }

  static async streamRunEvents(
    requestId: string,
    callbacks: {
      onEvent: (event: StreamEvent) => void;
      onError: (err: Error) => void;
      onComplete: () => void;
    }
  ) {
    try {
      const response = await fetch(`${API_BASE_URL}/run/${requestId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to stream events: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          if (buffer.trim()) {
            try {
              callbacks.onEvent(JSON.parse(buffer));
            } catch (e) {
              console.warn('Failed to parse final chunk', buffer);
            }
          }
          callbacks.onComplete();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              callbacks.onEvent(JSON.parse(line));
            } catch (e) {
              console.warn('Failed to parse chunk line', line);
            }
          }
        }
      }
    } catch (err: any) {
      callbacks.onError(err);
    }
  }
}
