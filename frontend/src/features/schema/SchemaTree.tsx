import type React from 'react';
import { useSchemaStore, type SchemaNode } from '../../store/schemaStore';
import { Database, Folder, Hash, List, Repeat, Trash2, ArrowUp, ArrowDown, Plus } from 'lucide-react';
import { PropertiesPanel } from './PropertiesPanel';
import { ExecutionPanel } from './ExecutionPanel';
import './SchemaTree.css';

const getNodeIcon = (type: string) => {
  switch (type) {
    case 'input': return <Folder size={14} />;
    case 'int': 
    case 'float': return <Hash size={14} />;
    case 'array': return <List size={14} />;
    case 'repeat': return <Repeat size={14} />;
    default: return <Database size={14} />;
  }
};

const TreeNode: React.FC<{ node: SchemaNode; depth?: number; parentId?: string; isFirst?: boolean; isLast?: boolean }> = ({ node, depth = 0, parentId, isFirst, isLast }) => {
  const { selectedNodeId, selectNode, moveNode, deleteNode, addNode } = useSchemaStore();
  const isSelected = selectedNodeId === node.id;

  const handleAdd = (e: React.MouseEvent, type: 'int' | 'float' | 'array' | 'repeat') => {
    e.stopPropagation();
    addNode(node.id, type);
  };

  return (
    <div className="tree-node-container">
      <div 
        className={`tree-node ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => selectNode(isSelected ? null : node.id)}
      >
        <span className="node-icon">
          {getNodeIcon(node.type)}
        </span>
        <span className="node-name">
          {node.type === 'input' ? 'Input' : (node as any).name || node.type}
        </span>
        
        <div className="node-actions">
          {parentId && (
            <>
              <button 
                className="action-btn" 
                onClick={(e) => { e.stopPropagation(); moveNode(node.id, 'up'); }}
                disabled={isFirst}
              >
                <ArrowUp size={12} />
              </button>
              <button 
                className="action-btn" 
                onClick={(e) => { e.stopPropagation(); moveNode(node.id, 'down'); }}
                disabled={isLast}
              >
                <ArrowDown size={12} />
              </button>
              <button 
                className="action-btn danger" 
                onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }}
              >
                <Trash2 size={12} />
              </button>
            </>
          )}
          {node.type === 'input' && (
            <div className="add-menu">
              <button className="action-btn" onClick={(e) => e.stopPropagation()}>
                <Plus size={12} />
              </button>
              <div className="add-dropdown">
                <div onClick={(e) => handleAdd(e, 'int')}>Int</div>
                <div onClick={(e) => handleAdd(e, 'float')}>Float</div>
                <div onClick={(e) => handleAdd(e, 'array')}>Array</div>
                <div onClick={(e) => handleAdd(e, 'repeat')}>Repeat</div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {node.type === 'input' && (
        <div className="tree-children">
          <div className="indent-guide" style={{ left: `${depth * 16 + 14}px` }} />
          {node.children.map((child, idx) => (
            <TreeNode 
              key={child.id} 
              node={child} 
              depth={depth + 1} 
              parentId={node.id}
              isFirst={idx === 0}
              isLast={idx === node.children.length - 1}
            />
          ))}
        </div>
      )}
      
      {node.type === 'repeat' && (
        <div className="tree-children">
          <div className="indent-guide" style={{ left: `${depth * 16 + 14}px` }} />
          <TreeNode 
            node={node.input} 
            depth={depth + 1} 
          />
        </div>
      )}

      {node.type === 'array' && (
        <div className="tree-children">
          <div className="indent-guide" style={{ left: `${depth * 16 + 14}px` }} />
          <TreeNode 
            node={node.elementType} 
            depth={depth + 1} 
          />
        </div>
      )}
    </div>
  );
};

export const SchemaTree: React.FC = () => {
  const { rootNode } = useSchemaStore();

  return (
    <div className="schema-sidebar">
      <div className="schema-tree">
        <div className="schema-header">
          <Database size={14} className="header-icon" />
          <h3>Schema</h3>
        </div>
        <div className="schema-content">
          <TreeNode node={rootNode} />
        </div>
      </div>
      
      <div className="schema-properties">
        <PropertiesPanel />
      </div>

      <div className="schema-execution">
        <ExecutionPanel />
      </div>
    </div>
  );
};
