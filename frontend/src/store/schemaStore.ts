import { create } from 'zustand';

export type SchemaNode = IntNode | FloatNode | ArrayNode | RepeatNode | InputNode;

export interface IntNode { id: string; type: 'int'; name: string; min: string; max: string; }
export interface FloatNode { id: string; type: 'float'; name: string; min: string; max: string; }

export interface ArrayNode { 
  id: string; 
  type: 'array'; 
  name: string; 
  size: string; 
  sorted: boolean; 
  elementType: IntNode | FloatNode; 
}

export interface RepeatNode { 
  id: string; 
  type: 'repeat'; 
  times: string; 
  input: InputNode; 
}

export interface InputNode { 
  id: string; 
  type: 'input'; 
  children: SchemaNode[]; 
}

interface SchemaState {
  rootNode: InputNode;
  selectedNodeId: string | null;
  selectNode: (id: string | null) => void;
  updateNode: (id: string, updates: Partial<SchemaNode>) => void;
  addNode: (parentId: string, type: 'int' | 'float' | 'array' | 'repeat') => void;
  deleteNode: (id: string) => void;
  moveNode: (id: string, direction: 'up' | 'down') => void;
  xVar: { type: 'int'; name: string; min: string; max: string };
  setXVar: (updates: Partial<{ name: string; min: string; max: string }>) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const createDefaultNode = (type: string): SchemaNode => {
  const id = generateId();
  switch (type) {
    case 'int': return { id, type: 'int', name: 'newInt', min: '1', max: '10' };
    case 'float': return { id, type: 'float', name: 'newFloat', min: '0.0', max: '1.0' };
    case 'array': return { id, type: 'array', name: 'newArray', size: '5', sorted: false, elementType: { id: generateId(), type: 'int', name: 'element', min: '1', max: '100' } };
    case 'repeat': return { id, type: 'repeat', times: '3', input: { id: generateId(), type: 'input', children: [] } };
    default: throw new Error("Unknown type");
  }
};

const recursiveUpdate = (node: SchemaNode, targetId: string, updates: Partial<SchemaNode>): SchemaNode => {
  if (node.id === targetId) return { ...node, ...updates } as SchemaNode;
  if (node.type === 'input') return { ...node, children: node.children.map(c => recursiveUpdate(c, targetId, updates)) };
  if (node.type === 'repeat') return { ...node, input: recursiveUpdate(node.input, targetId, updates) as InputNode };
  if (node.type === 'array' && node.elementType.id === targetId) return { ...node, elementType: { ...node.elementType, ...updates } as any };
  return node;
};

const recursiveAdd = (node: SchemaNode, parentId: string, newNode: SchemaNode): SchemaNode => {
  if (node.id === parentId && node.type === 'input') return { ...node, children: [...node.children, newNode] };
  if (node.type === 'input') return { ...node, children: node.children.map(c => recursiveAdd(c, parentId, newNode)) };
  if (node.type === 'repeat') return { ...node, input: recursiveAdd(node.input, parentId, newNode) as InputNode };
  return node;
};

const recursiveDelete = (node: SchemaNode, targetId: string): SchemaNode | null => {
  if (node.id === targetId) return null;
  if (node.type === 'input') return { ...node, children: node.children.map(c => recursiveDelete(c, targetId)).filter(Boolean) as SchemaNode[] };
  if (node.type === 'repeat') return { ...node, input: recursiveDelete(node.input, targetId) as InputNode };
  return node;
};

const recursiveMove = (node: SchemaNode, targetId: string, direction: 'up' | 'down'): SchemaNode => {
  if (node.type === 'input') {
    const idx = node.children.findIndex(c => c.id === targetId);
    if (idx !== -1) {
      const newChildren = [...node.children];
      if (direction === 'up' && idx > 0) {
        [newChildren[idx - 1], newChildren[idx]] = [newChildren[idx], newChildren[idx - 1]];
      } else if (direction === 'down' && idx < newChildren.length - 1) {
        [newChildren[idx + 1], newChildren[idx]] = [newChildren[idx], newChildren[idx + 1]];
      }
      return { ...node, children: newChildren };
    }
    return { ...node, children: node.children.map(c => recursiveMove(c, targetId, direction)) };
  }
  if (node.type === 'repeat') return { ...node, input: recursiveMove(node.input, targetId, direction) as InputNode };
  return node;
};

const initialRoot: InputNode = {
  id: 'root',
  type: 'input',
  children: [
    { id: generateId(), type: 'int', name: 'n', min: '1', max: '10' },
    { id: generateId(), type: 'array', name: 'A', size: 'n', sorted: false, elementType: { id: generateId(), type: 'int', name: 'element', min: '1', max: '100' } }
  ]
};

export const useSchemaStore = create<SchemaState>((set) => ({
  rootNode: initialRoot,
  selectedNodeId: null,
  selectNode: (id) => set({ selectedNodeId: id }),
  updateNode: (id, updates) => set((state) => ({ rootNode: recursiveUpdate(state.rootNode, id, updates) as InputNode })),
  addNode: (parentId, type) => set((state) => ({ rootNode: recursiveAdd(state.rootNode, parentId, createDefaultNode(type)) as InputNode })),
  deleteNode: (id) => set((state) => ({ 
    rootNode: recursiveDelete(state.rootNode, id) as InputNode,
    selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId
  })),
  moveNode: (id, direction) => set((state) => ({ rootNode: recursiveMove(state.rootNode, id, direction) as InputNode })),
  xVar: { type: 'int', name: 'n', min: '1', max: '10' },
  setXVar: (updates) => set((state) => ({ xVar: { ...state.xVar, ...updates } })),
}));
