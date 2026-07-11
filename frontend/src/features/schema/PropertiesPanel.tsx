
import { useSchemaStore, type SchemaNode, type IntNode, type ArrayNode, type RepeatNode } from '../../store/schemaStore';
import './PropertiesPanel.css';

const findNode = (node: SchemaNode, id: string): SchemaNode | null => {
  if (node.id === id) return node;
  if (node.type === 'input') {
    for (const child of node.children) {
      const found = findNode(child, id);
      if (found) return found;
    }
  }
  if (node.type === 'repeat') return findNode(node.input, id);
  if (node.type === 'array' && node.elementType.id === id) return node.elementType;
  return null;
};

export const PropertiesPanel = () => {
  const { rootNode, selectedNodeId, updateNode } = useSchemaStore();

  const selectedNode = selectedNodeId ? findNode(rootNode, selectedNodeId) : null;

  const handleUpdate = (updates: Partial<SchemaNode>) => {
    if (selectedNodeId) updateNode(selectedNodeId, updates);
  };

  if (!selectedNode) {
    return (
      <div className="properties-panel">
        <div className="panel-header">
          <h4>Properties</h4>
        </div>
        <div className="empty-state">
          <p>Select a node to view its properties.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="properties-panel">
      <div className="panel-header">
        <h4>Properties</h4>
        <span className="node-badge">{selectedNode.type}</span>
      </div>
      
      <div className="panel-body">
        {selectedNode.type !== 'input' && selectedNode.type !== 'repeat' && (
          <div className="form-group">
            <label>Name</label>
            <input 
              type="text" 
              value={(selectedNode as IntNode).name || ''} 
              onChange={e => handleUpdate({ name: e.target.value })}
            />
          </div>
        )}

        {(selectedNode.type === 'int' || selectedNode.type === 'float') && (
          <div className="form-row">
            <div className="form-group">
              <label>Min</label>
              <input 
                type="text" 
                value={(selectedNode as IntNode).min} 
                onChange={e => handleUpdate({ min: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Max</label>
              <input 
                type="text" 
                value={(selectedNode as IntNode).max} 
                onChange={e => handleUpdate({ max: e.target.value })}
              />
            </div>
          </div>
        )}

        {selectedNode.type === 'array' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Size</label>
                <input 
                  type="text" 
                  value={(selectedNode as ArrayNode).size} 
                  onChange={e => handleUpdate({ size: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select 
                  value={(selectedNode as ArrayNode).elementType.type}
                  onChange={e => {
                    const type = e.target.value as 'int' | 'float';
                    const el = (selectedNode as ArrayNode).elementType;
                    handleUpdate({ elementType: { ...el, type } as any });
                  }}
                >
                  <option value="int">Int</option>
                  <option value="float">Float</option>
                </select>
              </div>
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input 
                  type="checkbox" 
                  checked={(selectedNode as ArrayNode).sorted} 
                  onChange={e => handleUpdate({ sorted: e.target.checked })}
                />
                Sorted
              </label>
            </div>
          </>
        )}

        {selectedNode.type === 'repeat' && (
          <div className="form-group">
            <label>Times</label>
            <input 
              type="text" 
              value={(selectedNode as RepeatNode).times} 
              onChange={e => handleUpdate({ times: e.target.value })}
            />
          </div>
        )}

        {selectedNode.type === 'input' && (
          <div className="form-info">
            This is an input container. You can add child nodes to it.
          </div>
        )}
      </div>
    </div>
  );
};
