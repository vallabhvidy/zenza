import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useOutputStore } from '../../store/outputStore';
import './GraphView.css';

export const GraphView: React.FC = () => {
  const { metrics } = useOutputStore();
  const [metricType, setMetricType] = useState<'time' | 'memory'>('time');

  if (metrics.length === 0) {
    return (
      <div className="graph-empty-state">
        <div className="empty-icon">📈</div>
        <div className="empty-title">No Data Available</div>
        <div className="empty-subtitle">Run the code to see performance graphs here.</div>
      </div>
    );
  }

  // Use computed styles to get CSS variables for recharts (fallback to defaults if undefined)
  const getCssVar = (name: string, fallback: string) => {
    if (typeof window === 'undefined') return fallback;
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  };

  const accentPrimary = getCssVar('--accent-primary', '#3b82f6');
  const textMuted = getCssVar('--text-muted', '#94a3b8');
  const bgSurface = getCssVar('--bg-surface', '#1e293b');
  const borderColor = getCssVar('--border-color', '#334155');
  const textMain = getCssVar('--text-main', '#f8fafc');

  const isTime = metricType === 'time';
  const dataKey = isTime ? 'time' : 'memory';
  const yAxisLabel = isTime ? 'Time (ms)' : 'Memory (KB)';
  const valueFormatter = (value: any) => {
    const num = Number(value);
    return isTime ? [`${num.toFixed(2)} ms`, 'Time'] : [`${num.toLocaleString()} KB`, 'Memory'];
  };

  return (
    <div className="graph-container">
      <div className="graph-header">
        <div className="graph-title-area">
          <h3>{isTime ? 'Time Complexity' : 'Memory Complexity'}</h3>
          <span className="graph-subtitle">
            {isTime ? 'Execution time vs N' : 'Memory usage vs N'}
          </span>
        </div>
        <div className="graph-toggle-group">
          <button 
            className={`toggle-btn ${isTime ? 'active' : ''}`}
            onClick={() => setMetricType('time')}
          >
            Time
          </button>
          <button 
            className={`toggle-btn ${!isTime ? 'active' : ''}`}
            onClick={() => setMetricType('memory')}
          >
            Memory
          </button>
        </div>
      </div>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={metrics}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={borderColor} vertical={false} />
            <XAxis 
              dataKey="n" 
              type="number"
              domain={['dataMin', 'dataMax']}
              stroke={textMuted} 
              tick={{ fill: textMuted, fontSize: 12 }}
              tickLine={{ stroke: borderColor }}
              axisLine={{ stroke: borderColor }}
              label={{ value: 'Input Size (N)', position: 'insideBottom', offset: -10, fill: textMuted, fontSize: 13 }}
            />
            <YAxis 
              stroke={textMuted}
              tick={{ fill: textMuted, fontSize: 12 }}
              tickLine={{ stroke: borderColor }}
              axisLine={{ stroke: borderColor }}
              label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', offset: 0, fill: textMuted, fontSize: 13 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: bgSurface, 
                borderColor: borderColor,
                borderRadius: '6px',
                color: textMain,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}
              itemStyle={{ color: accentPrimary }}
              labelStyle={{ color: textMuted, marginBottom: '4px', fontWeight: 600 }}
              formatter={valueFormatter}
              labelFormatter={(label: any) => `N = ${label}`}
              animationDuration={200}
            />
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke={accentPrimary} 
              strokeWidth={3}
              dot={{ r: 4, fill: bgSurface, stroke: accentPrimary, strokeWidth: 2 }}
              activeDot={{ r: 6, fill: accentPrimary, stroke: bgSurface, strokeWidth: 2 }}
              isAnimationActive={true}
              animationDuration={500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
