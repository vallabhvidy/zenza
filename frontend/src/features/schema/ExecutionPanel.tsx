import type React from 'react';
import { useSchemaStore } from '../../store/schemaStore';
import './PropertiesPanel.css'; // Reuse CSS

export const ExecutionPanel: React.FC = () => {
  const { xVar, setXVar } = useSchemaStore();

  return (
    <div className="properties-panel execution-panel">
      <div className="panel-header">
        <h4>Execution Parameter (x_var)</h4>
      </div>
      <div className="panel-body">
        <div className="form-group">
          <label>Name</label>
          <input 
            type="text" 
            value={xVar.name} 
            onChange={e => setXVar({ name: e.target.value })}
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Min</label>
            <input 
              type="text" 
              value={xVar.min} 
              onChange={e => setXVar({ min: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Max</label>
            <input 
              type="text" 
              value={xVar.max} 
              onChange={e => setXVar({ max: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
