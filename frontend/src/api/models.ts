import type { InputNode, IntNode } from '../store/schemaStore';

export interface RunRequestPayload {
  code: string;
  language: 'cpp' | 'python';
  input_schema: InputNode;
  x_var: IntNode;
  reduce_noise: boolean;
  search: boolean;
}

export interface RunResponse {
  request_id: string;
}

export interface StreamEvent {
  [key: string]: any;
}
