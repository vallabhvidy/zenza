import { create } from 'zustand';
import { TEMPLATES, type Complexity } from './templates';
import { useSchemaStore, type InputNode } from './schemaStore';

export type Language = 'python' | 'cpp';

interface EditorState {
  language: Language;
  codes: Record<Language, string>;
  setCode: (code: string) => void;
  setLanguage: (lang: Language) => void;
  loadTemplate: (id: Complexity) => void;
}

const DEFAULT_TEMPLATES = {
  python: `# Write your code here\n\ndef main():\n    print("Hello Zenza")\n`,
  cpp: `#include <iostream>\n\nint main() {\n    std::cout << "Hello Zenza" << std::endl;\n    return 0;\n}\n`,
};

const generateId = () => Math.random().toString(36).substring(2, 9);

const convertTemplateNode = (node: any): any => {
  const id = generateId();
  if (node.type === 'input') {
    return {
      id,
      type: 'input',
      children: (node.children || []).map(convertTemplateNode),
    };
  }
  if (node.type === 'repeat') {
    return {
      id,
      type: 'repeat',
      times: node.times || '3',
      input: convertTemplateNode(node.input),
    };
  }
  if (node.type === 'array') {
    return {
      id,
      type: 'array',
      name: node.name || 'newArray',
      size: node.size || '5',
      sorted: node.sorted || false,
      elementType: convertTemplateNode(node.elementType),
    };
  }
  return {
    id,
    ...node,
  };
};

export const useEditorStore = create<EditorState>((set) => ({
  language: 'python',
  codes: DEFAULT_TEMPLATES,
  setCode: (code) =>
    set((state) => ({
      codes: { ...state.codes, [state.language]: code },
    })),
  setLanguage: (language) => set({ language }),
  loadTemplate: (id) =>
    set((state) => {
      const template = TEMPLATES.find((t) => t.id === id);
      if (!template) return {};
      const newCode = state.language === 'python' ? template.python : template.cpp;
      
      // Convert schema nodes to include unique IDs and set in schema store
      const newRootNode = convertTemplateNode(template.schema) as InputNode;
      const nChild = template.schema.children?.find((c) => c.name === 'n');
      useSchemaStore.setState({ 
        rootNode: newRootNode,
        selectedNodeId: null,
        xVar: {
          type: 'int',
          name: 'n',
          min: nChild?.min || '1',
          max: nChild?.max || '10',
        }
      });

      return {
        codes: { ...state.codes, [state.language]: newCode },
      };
    }),
}));
