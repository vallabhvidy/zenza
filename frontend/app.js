/* Zenza Frontend Controller */

const API_BASE = window.location.protocol.startsWith('http') 
  ? window.location.origin 
  : 'http://localhost:8000';

let editor = null;
let chart = null;
let currentRequestId = null;
let isRunning = false;
let currentRunData = [];
let activeMode = 'dual'; // 'dual', 'time', 'memory'
let isMonacoLoaded = false;
let isChartLoaded = false;

// Unique ID helper for schema builder
let nodeIdCounter = 0;
function uniqueId() {
    return `node-${++nodeIdCounter}`;
}

// Initial state schema tree
let schemaNodes = [];

// DOM Elements
const backendStatus = document.getElementById('backend-status');
const templateSelect = document.getElementById('template-select');
const langSelect = document.getElementById('lang-select');
const xVarSelect = document.getElementById('x-var-select');
const xMinInput = document.getElementById('x-min-input');
const xMaxInput = document.getElementById('x-max-input');
const chkSearch = document.getElementById('chk-search');
const chkNoise = document.getElementById('chk-noise');
const btnRun = document.getElementById('btn-run');
const btnStop = document.getElementById('btn-stop');
const statN = document.getElementById('stat-n');
const statTime = document.getElementById('stat-time');
const statMemory = document.getElementById('stat-memory');
const statStatus = document.getElementById('stat-status');
const terminalOutput = document.getElementById('terminal-output');
const btnClearTerminal = document.getElementById('btn-clear-terminal');
const btnClearChart = document.getElementById('btn-clear-chart');
const btnToggleTimeMemory = document.getElementById('btn-toggle-time-memory');
const btnExportCsv = document.getElementById('btn-export-csv');
const historyItems = document.getElementById('history-items');
const tableBody = document.querySelector('#run-data-table tbody');

// Templates definitions
const TEMPLATES = {
    'bubble-sort': {
        lang: 'python',
        code: `# Bubble Sort in Python
import sys

def solve():
    # Read entire input from stdin
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    
    n = int(input_data[0])
    # Read the n integers of the array
    arr = [int(x) for x in input_data[1:n+1]]
    
    # Bubble Sort: O(N²) average and worst case
    for i in range(n):
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
                
    print("Sorted Successfully")

if __name__ == '__main__':
    solve()`,
        schema: [
            { id: 't1_n', type: 'int', name: 'n', min: '1', max: '1000' },
            { id: 't1_arr', type: 'array', name: 'arr', size: 'n', sorted: false, 
              elementType: { type: 'int', min: '1', max: '100000' } }
        ],
        x_var: { name: 'n', min: '10', max: '500', search: false, noise: true }
    },
    'binary-search': {
        lang: 'cpp',
        code: `// Binary Search in C++
#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    // Optimize standard I/O operations
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    int n;
    if (!(cin >> n)) return 0;
    
    // Read sorted array
    vector<int> a(n);
    for (int i = 0; i < n; i++) {
        cin >> a[i];
    }
    
    int target;
    if (!(cin >> target)) return 0;
    
    // Binary Search: O(log N)
    bool found = binary_search(a.begin(), a.end(), target);
    cout << (found ? "FOUND" : "NOT FOUND") << "\\n";
    
    return 0;
}`,
        schema: [
            { id: 't2_n', type: 'int', name: 'n', min: '1', max: '1000000' },
            { id: 't2_arr', type: 'array', name: 'arr', size: 'n', sorted: true, 
              elementType: { type: 'int', min: '1', max: '1000000' } },
            { id: 't2_target', type: 'int', name: 'target', min: '1', max: '1000000' }
        ],
        x_var: { name: 'n', min: '100', max: '100000', search: true, noise: true }
    },
    'linear-search': {
        lang: 'cpp',
        code: `// Linear Search in C++
#include <iostream>
#include <vector>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    int n;
    if (!(cin >> n)) return 0;
    
    vector<int> a(n);
    for (int i = 0; i < n; i++) {
        cin >> a[i];
    }
    
    int target;
    if (!(cin >> target)) return 0;
    
    // Linear Search: O(N)
    int found_idx = -1;
    for (int i = 0; i < n; i++) {
        if (a[i] == target) {
            found_idx = i;
            break;
        }
    }
    
    cout << found_idx << "\\n";
    return 0;
}`,
        schema: [
            { id: 't3_n', type: 'int', name: 'n', min: '1', max: '1000000' },
            { id: 't3_arr', type: 'array', name: 'arr', size: 'n', sorted: false, 
              elementType: { type: 'int', min: '1', max: '1000000' } },
            { id: 't3_target', type: 'int', name: 'target', min: '1', max: '1000000' }
        ],
        x_var: { name: 'n', min: '100', max: '50000', search: false, noise: true }
    },
    'fibonacci': {
        lang: 'python',
        code: `# Fibonacci Dynamic Programming in Python
import sys

def fib(n):
    if n <= 1:
        return n
    dp = [0] * (n + 1)
    dp[1] = 1
    for i in range(2, n + 1):
        dp[i] = dp[i-1] + dp[i-2]
    return dp[n]

def solve():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    n = int(input_data[0])
    print(fib(n))

if __name__ == '__main__':
    solve()`,
        schema: [
            { id: 't4_n', type: 'int', name: 'n', min: '1', max: '50000' }
        ],
        x_var: { name: 'n', min: '10', max: '15000', search: false, noise: true }
    }
};

// Check Backend Connection
async function checkBackend() {
    try {
        const response = await fetch(`${API_BASE}/docs`, { method: 'GET', mode: 'cors' });
        if (response.ok || response.status === 404 || response.status === 200) {
            backendStatus.className = 'status-badge online';
            backendStatus.querySelector('.status-text').textContent = 'Backend Online';
        } else {
            throw new Error();
        }
    } catch (e) {
        backendStatus.className = 'status-badge offline';
        backendStatus.querySelector('.status-text').textContent = 'Backend Offline';
    }
}

// Monaco Editor Initialization with Graceful Fallback
function initMonaco() {
    if (typeof require !== 'undefined') {
        try {
            require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs' } });
            require(['vs/editor/editor.main'], function () {
                editor = monaco.editor.create(document.getElementById('editor-container'), {
                    value: TEMPLATES['bubble-sort'].code,
                    language: 'python',
                    theme: 'vs-dark',
                    automaticLayout: true,
                    fontSize: 14,
                    fontFamily: 'JetBrains Mono',
                    minimap: { enabled: false },
                    roundedSelection: true,
                    scrollBeyondLastLine: false,
                    padding: { top: 12, bottom: 12 }
                });
                isMonacoLoaded = true;
                
                // Load initial template configurations
                loadTemplate('bubble-sort');
            });
            return;
        } catch (e) {
            console.error("Monaco loading failed:", e);
        }
    }
    
    // Fallback to simple textarea
    setupTextareaFallback();
}

function setupTextareaFallback() {
    const monacoDiv = document.getElementById('editor-container');
    const fallbackTa = document.getElementById('editor-fallback');
    
    if (monacoDiv) monacoDiv.style.display = 'none';
    if (fallbackTa) {
        fallbackTa.style.display = 'block';
        fallbackTa.value = TEMPLATES['bubble-sort'].code;
    }
    
    // Mock Monaco Editor API
    editor = {
        getValue: () => fallbackTa.value,
        setValue: (val) => { fallbackTa.value = val; }
    };
    
    isMonacoLoaded = false;
    loadTemplate('bubble-sort');
    log("Monaco Editor CDN unreachable. Fell back to standard text editor.", "warning");
}

// Chart.js Setup with Graceful Fallback
function initChart() {
    if (typeof Chart === 'undefined') {
        setupChartFallback();
        return;
    }
    
    try {
        const ctx = document.getElementById('benchmarkChart').getContext('2d');
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: 'Execution Time (ms)',
                        data: [],
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        yAxisID: 'yTime',
                        tension: 0.15,
                        borderWidth: 2.5,
                        pointRadius: 4,
                        pointHoverRadius: 7,
                        pointBackgroundColor: 'rgb(59, 130, 246)'
                    },
                    {
                        label: 'Memory Usage (KB)',
                        data: [],
                        borderColor: 'rgb(168, 85, 247)',
                        backgroundColor: 'rgba(168, 85, 247, 0.1)',
                        yAxisID: 'yMemory',
                        tension: 0.15,
                        borderWidth: 2.5,
                        pointRadius: 4,
                        pointHoverRadius: 7,
                        pointBackgroundColor: 'rgb(168, 85, 247)'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Input Size (N)',
                            color: '#94a3b8',
                            font: { family: 'Plus Jakarta Sans', weight: 'bold' }
                        },
                        grid: { color: 'rgba(38, 54, 84, 0.12)' },
                        ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono' } }
                    },
                    yTime: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Time (ms)',
                            color: 'rgb(59, 130, 246)',
                            font: { family: 'Plus Jakarta Sans', weight: 'bold' }
                        },
                        grid: { color: 'rgba(38, 54, 84, 0.12)' },
                        ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono' } }
                    },
                    yMemory: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Memory (KB)',
                            color: 'rgb(168, 85, 247)',
                            font: { family: 'Plus Jakarta Sans', weight: 'bold' }
                        },
                        grid: { drawOnChartArea: false },
                        ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono' } }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#f1f5f9',
                            font: { family: 'Plus Jakarta Sans', size: 12 }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: '#151d2a',
                        titleColor: '#f1f5f9',
                        bodyColor: '#e2e8f0',
                        borderColor: 'rgba(38, 54, 84, 0.8)',
                        borderWidth: 1,
                        titleFont: { family: 'Plus Jakarta Sans', weight: 'bold' },
                        bodyFont: { family: 'JetBrains Mono' }
                    }
                }
            }
        });
        isChartLoaded = true;
    } catch (e) {
        console.error("Chart.js setup failed:", e);
        setupChartFallback();
    }
}

function setupChartFallback() {
    const canvas = document.getElementById('benchmarkChart');
    const fallbackDiv = document.getElementById('chart-fallback');
    
    if (canvas) canvas.style.display = 'none';
    if (fallbackDiv) fallbackDiv.style.display = 'flex';
    
    isChartLoaded = false;
    log("Chart.js CDN unreachable. Using local text bar rendering.", "warning");
}

function updateChartFallback() {
    const container = document.getElementById('fallback-bars-container');
    if (!container) return;
    
    container.innerHTML = '';
    const maxTime = Math.max(...currentRunData.map(d => d.time), 0.001);
    
    // Take the 12 latest points to avoid overflowing screen space
    const displayPoints = currentRunData.slice(-12);
    
    displayPoints.forEach(pt => {
        const barWrapper = document.createElement('div');
        barWrapper.className = 'fallback-bar-wrapper';
        
        const heightPercent = Math.max(5, (pt.time / maxTime) * 100);
        
        const bar = document.createElement('div');
        bar.className = 'fallback-bar';
        bar.style.height = `${heightPercent}%`;
        bar.title = `N=${pt.n}, Time=${pt.time}ms`;
        
        const label = document.createElement('span');
        label.className = 'fallback-bar-label';
        label.textContent = pt.n;
        
        barWrapper.appendChild(bar);
        barWrapper.appendChild(label);
        container.appendChild(barWrapper);
    });
}

// Log Terminal Utilities
function log(msg, type = 'info') {
    const line = document.createElement('div');
    line.className = `terminal-line ${type}`;
    
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    line.innerHTML = `<span class="time-prefix">[${timestamp}]</span> ${msg}`;
    
    terminalOutput.appendChild(line);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function clearTerminal() {
    terminalOutput.innerHTML = '<div class="terminal-line system-msg">Terminal logs cleared.</div>';
}

// Template Loader
function loadTemplate(key) {
    const tpl = TEMPLATES[key];
    if (!tpl) return;
    
    // Set Editor source and Language select
    if (editor) {
        editor.setValue(tpl.code);
        if (isMonacoLoaded && typeof monaco !== 'undefined') {
            monaco.editor.setModelLanguage(editor.getModel(), tpl.lang);
        }
    }
    langSelect.value = tpl.lang;
    
    // Set schema state (deep copy)
    schemaNodes = JSON.parse(JSON.stringify(tpl.schema));
    renderSchema();
    
    // Set config fields
    xMinInput.value = tpl.x_var.min;
    xMaxInput.value = tpl.x_var.max;
    chkSearch.checked = tpl.x_var.search;
    chkNoise.checked = tpl.x_var.noise;
    
    // Sync dropdown options
    syncXVarOptions();
    xVarSelect.value = tpl.x_var.name;
    
    log(`Loaded template: "${templateSelect.options[templateSelect.selectedIndex].text}"`, 'success');
}

// Visual Schema Builder Renderer
function renderSchema() {
    const listContainer = document.getElementById('schema-nodes-list');
    listContainer.innerHTML = '';
    
    if (schemaNodes.length === 0) {
        listContainer.innerHTML = '<div class="no-nodes-msg text-center text-muted py-4">No generator fields defined. Add integer, array, or repeat.</div>';
        return;
    }
    
    schemaNodes.forEach((node, index) => {
        const el = createNodeDOM(node, schemaNodes, index);
        listContainer.appendChild(el);
    });
}

// Create DOM for a single Schema node (recursively handling Nesting)
function createNodeDOM(node, parentList, index) {
    const item = document.createElement('div');
    item.className = 'schema-node';
    item.id = node.id;
    
    // Top Row: Badge and Delete Button
    const topRow = document.createElement('div');
    topRow.className = 'node-row-top';
    
    const badge = document.createElement('span');
    badge.className = `node-badge ${node.type}`;
    badge.textContent = node.type;
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'node-delete';
    deleteBtn.innerHTML = '<i class="ri-delete-bin-line"></i>';
    deleteBtn.onclick = () => {
        parentList.splice(index, 1);
        renderSchema();
        syncXVarOptions();
    };
    
    topRow.appendChild(badge);
    topRow.appendChild(deleteBtn);
    item.appendChild(topRow);
    
    // Inputs Row
    const inputsGrid = document.createElement('div');
    inputsGrid.className = 'node-inputs-grid';
    
    if (node.type === 'int') {
        // Name
        inputsGrid.appendChild(createInputField('Name', node.name, (val) => {
            node.name = val;
            syncXVarOptions();
        }));
        // Min
        inputsGrid.appendChild(createInputField('Min', node.min, (val) => {
            node.min = val;
        }));
        // Max
        inputsGrid.appendChild(createInputField('Max', node.max, (val) => {
            node.max = val;
        }));
        
    } else if (node.type === 'array') {
        // Name
        inputsGrid.appendChild(createInputField('Name', node.name, (val) => {
            node.name = val;
        }));
        // Size variable or number
        inputsGrid.appendChild(createInputField('Size', node.size, (val) => {
            node.size = val;
        }));
        
        // Sorted Checkbox
        const sortedWrapper = document.createElement('div');
        sortedWrapper.className = 'node-input-group checkbox-wrapper';
        sortedWrapper.style.flexDirection = 'row';
        sortedWrapper.style.alignItems = 'center';
        sortedWrapper.style.paddingBottom = '10px';
        
        const sortedInput = document.createElement('input');
        sortedInput.type = 'checkbox';
        sortedInput.checked = node.sorted;
        sortedInput.id = `sort-${node.id}`;
        sortedInput.onchange = (e) => { node.sorted = e.target.checked; };
        
        const sortedLabel = document.createElement('label');
        sortedLabel.htmlFor = `sort-${node.id}`;
        sortedLabel.textContent = 'Sorted Array';
        
        sortedWrapper.appendChild(sortedInput);
        sortedWrapper.appendChild(sortedLabel);
        inputsGrid.appendChild(sortedWrapper);
        
        // Element Type dropdown selector
        const typeWrapper = document.createElement('div');
        typeWrapper.className = 'node-input-group';
        typeWrapper.innerHTML = `<label>Elem Type</label>`;
        
        const typeSelect = document.createElement('select');
        typeSelect.className = 'styled-select-sm';
        ['int', 'char', 'float'].forEach(t => {
            const opt = document.createElement('option');
            opt.value = t;
            opt.textContent = t.toUpperCase();
            if (node.elementType.type === t) opt.selected = true;
            typeSelect.appendChild(opt);
        });
        
        typeSelect.onchange = (e) => {
            const val = e.target.value;
            node.elementType.type = val;
            // Update node elements
            if (val === 'int' || val === 'float') {
                delete node.elementType.fromChars;
                node.elementType.min = node.elementType.min || '0';
                node.elementType.max = node.elementType.max || '100';
            } else {
                delete node.elementType.min;
                delete node.elementType.max;
                node.elementType.fromChars = ['a','b','c','d','e'];
            }
            renderSchema();
        };
        typeWrapper.appendChild(typeSelect);
        inputsGrid.appendChild(typeWrapper);
        
        // Nested array elements min/max or chars
        if (node.elementType.type === 'int' || node.elementType.type === 'float') {
            inputsGrid.appendChild(createInputField('Elem Min', node.elementType.min, (val) => {
                node.elementType.min = val;
            }));
            inputsGrid.appendChild(createInputField('Elem Max', node.elementType.max, (val) => {
                node.elementType.max = val;
            }));
        } else {
            const valStr = node.elementType.fromChars ? node.elementType.fromChars.join('') : 'abcdefghijklmnopqrstuvwxyz';
            inputsGrid.appendChild(createInputField('Elem Chars', valStr, (val) => {
                node.elementType.fromChars = val.split('');
            }));
        }
        
    } else if (node.type === 'repeat') {
        // Times variable/number
        inputsGrid.appendChild(createInputField('Repeat Times', node.times, (val) => {
            node.times = val;
        }));
    }
    
    item.appendChild(inputsGrid);
    
    // Repeat block nested items
    if (node.type === 'repeat') {
        const nestedSection = document.createElement('div');
        nestedSection.className = 'nested-nodes-container';
        
        const nestedHeader = document.createElement('div');
        nestedHeader.className = 'nested-header';
        nestedHeader.innerHTML = `
            <span>Sub-elements:</span>
            <div class="nested-actions">
                <button class="btn-sm text-amber-500" style="padding: 2px 6px; font-size: 10px;" data-action="add-int"><i class="ri-add-line"></i> Int</button>
                <button class="btn-sm text-purple-500" style="padding: 2px 6px; font-size: 10px;" data-action="add-arr"><i class="ri-add-line"></i> Array</button>
            </div>
        `;
        
        // Add events to nested action buttons
        nestedHeader.querySelector('[data-action="add-int"]').onclick = (e) => {
            e.stopPropagation();
            node.input = node.input || { input: [] };
            node.input.input.push({ id: uniqueId(), type: 'int', name: 'sub_n', min: '0', max: '100' });
            renderSchema();
            syncXVarOptions();
        };
        nestedHeader.querySelector('[data-action="add-arr"]').onclick = (e) => {
            e.stopPropagation();
            node.input = node.input || { input: [] };
            node.input.input.push({ 
                id: uniqueId(), 
                type: 'array', 
                name: 'sub_arr', 
                size: '10', 
                sorted: false, 
                elementType: { type: 'int', min: '0', max: '100' } 
            });
            renderSchema();
        };
        
        nestedSection.appendChild(nestedHeader);
        
        // Render sub elements recursively
        const subList = node.input ? node.input.input : [];
        subList.forEach((subNode, subIdx) => {
            const subEl = createNodeDOM(subNode, subList, subIdx);
            nestedSection.appendChild(subEl);
        });
        
        item.appendChild(nestedSection);
    }
    
    return item;
}

// Input Field Creator Helper
function createInputField(labelText, value, onChange) {
    const group = document.createElement('div');
    group.className = 'node-input-group';
    
    const label = document.createElement('label');
    label.textContent = labelText;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = value || '';
    input.oninput = (e) => onChange(e.target.value);
    
    group.appendChild(label);
    group.appendChild(input);
    return group;
}

// Sync X Variable Dropdown options with all defined 'int' node names
function syncXVarOptions() {
    const prevVal = xVarSelect.value;
    xVarSelect.innerHTML = '';
    
    const intNames = [];
    
    function collectIntNames(list) {
        list.forEach(node => {
            if (node.type === 'int') {
                intNames.push(node.name);
            } else if (node.type === 'repeat' && node.input && node.input.input) {
                collectIntNames(node.input.input);
            }
        });
    }
    
    collectIntNames(schemaNodes);
    
    if (intNames.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = '-- No Int Variables --';
        xVarSelect.appendChild(opt);
        return;
    }
    
    intNames.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        xVarSelect.appendChild(opt);
    });
    
    if (intNames.includes(prevVal)) {
        xVarSelect.value = prevVal;
    }
}

// Extract Schema tree for API request
function extractSchemaJSON() {
    // Clear dynamic ids before exporting clean model structures
    function cleanNodes(nodes) {
        return nodes.map(node => {
            const cleaned = { type: node.type, name: node.name };
            
            if (node.type === 'int') {
                cleaned.min = String(node.min);
                cleaned.max = String(node.max);
            } else if (node.type === 'array') {
                cleaned.size = String(node.size);
                cleaned.sorted = !!node.sorted;
                cleaned.elementType = {
                    type: node.elementType.type,
                    name: 'NOCONTEXT'
                };
                if (node.elementType.type === 'int' || node.elementType.type === 'float') {
                    cleaned.elementType.min = String(node.elementType.min);
                    cleaned.elementType.max = String(node.elementType.max);
                } else {
                    cleaned.elementType.fromChars = node.elementType.fromChars;
                }
            } else if (node.type === 'repeat') {
                cleaned.times = String(node.times);
                cleaned.input = {
                    input: cleanNodes(node.input ? node.input.input : [])
                };
                delete cleaned.name; // repeat doesn't have name
            }
            return cleaned;
        });
    }
    
    return {
        input: cleanNodes(schemaNodes)
    };
}

// Big-O Complexity Estimator
function estimateComplexity(data) {
    if (data.length < 3) return 'Analyzing...';
    
    // Fit curves: O(1), O(log N), O(N), O(N log N), O(N^2)
    const nValues = data.map(d => d.n);
    const tValues = data.map(d => d.time);
    
    const maxT = Math.max(...tValues);
    if (maxT < 0.2) return 'O(1) [Constant Time]';
    
    const calculateRSquared = (xFunc) => {
        const xTrans = nValues.map(xFunc);
        const y = tValues;
        const n = y.length;
        
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;
        for (let i = 0; i < n; i++) {
            sumX += xTrans[i];
            sumY += y[i];
            sumXY += xTrans[i] * y[i];
            sumXX += xTrans[i] * xTrans[i];
            sumYY += y[i] * y[i];
        }
        
        const num = (n * sumXY - sumX * sumY);
        const den = (n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY);
        if (den === 0) return 0;
        return (num * num) / den;
    };
    
    const fits = [
        { label: 'O(log N) [Logarithmic]', r2: calculateRSquared(n => Math.log(n || 1)) },
        { label: 'O(N) [Linear]', r2: calculateRSquared(n => n) },
        { label: 'O(N log N) [Linear-Logarithmic]', r2: calculateRSquared(n => n * Math.log(n || 1)) },
        { label: 'O(N²) [Quadratic]', r2: calculateRSquared(n => n * n) },
        { label: 'O(N³) [Cubic]', r2: calculateRSquared(n => n * n * n) }
    ];
    
    fits.sort((a, b) => b.r2 - a.r2);
    
    if (fits[0].r2 < 0.6) {
        return 'Complex Complexity';
    }
    
    return fits[0].label;
}

// Start Benchmark Execution
async function runBenchmark() {
    if (isRunning) return;
    
    const codeContent = editor ? editor.getValue() : '';
    if (!codeContent.trim()) {
        log('No source code. Write some code first.', 'error');
        return;
    }
    
    const xVarName = xVarSelect.value;
    if (!xVarName) {
        log('X-Variable is missing. Add an Integer variable in your input schema.', 'error');
        return;
    }
    
    const hasIntNode = schemaNodes.some(n => n.type === 'int' && n.name === xVarName);
    if (!hasIntNode) {
        log(`Cannot find Int variable "${xVarName}" in schema. Make sure Name matches!`, 'error');
        return;
    }
    
    const xMin = xMinInput.value.trim();
    const xMax = xMaxInput.value.trim();
    if (!xMin || !xMax) {
        log('Specify Min and Max variables.', 'error');
        return;
    }

    try {
        isRunning = true;
        btnRun.disabled = true;
        btnStop.disabled = false;
        
        statN.textContent = 'Awaiting...';
        statTime.textContent = 'Awaiting...';
        statMemory.textContent = 'Awaiting...';
        statStatus.textContent = 'Starting...';
        
        log('Building benchmark payload...', 'info');
        
        const payload = {
            code: codeContent,
            language: langSelect.value,
            input_schema: extractSchemaJSON(),
            x_var: {
                type: 'int',
                name: xVarName,
                min: String(xMin),
                max: String(xMax)
            },
            reduce_noise: chkNoise.checked,
            search: chkSearch.checked
        };
        
        console.log("Payload:", payload);
        log(`Requesting container compile & sandbox init (${payload.language.toUpperCase()})...`, 'info');
        
        // 1. Post Run Request
        const runReqResponse = await fetch(`${API_BASE}/run_request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!runReqResponse.ok) {
            const errData = await runReqResponse.json();
            throw new Error(errData.detail?.message || errData.detail || 'Compile error or container failure');
        }
        
        const { request_id } = await runReqResponse.json();
        currentRequestId = request_id;
        
        log(`Sandbox initialized successfully. Request ID: ${request_id}`, 'success');
        
        if (payload.search) {
            log('Validating limits & Binary searching for stable maximum input bounds. Please wait...', 'warning');
        } else {
            log('Awaiting limit verification and warming up sandbox...', 'info');
        }
        
        // Clear old plot data
        currentRunData = [];
        if (isChartLoaded && chart) {
            chart.data.datasets[0].data = [];
            chart.data.datasets[1].data = [];
            chart.update();
        } else {
            const container = document.getElementById('fallback-bars-container');
            if (container) container.innerHTML = '';
        }
        
        // Reset detailed Table view
        tableBody.innerHTML = '';
        
        // 2. Stream Results
        const streamResponse = await fetch(`${API_BASE}/run/${request_id}`, {
            method: 'POST'
        });
        
        if (!streamResponse.ok) {
            const errData = await streamResponse.json();
            const msg = (errData.detail && errData.detail.message) ? errData.detail.message : 'Benchmark initialization failed';
            throw new Error(msg);
        }
        
        log('Starting data stream. Benchmarking algorithm scaling performance...', 'success');
        
        const reader = streamResponse.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop(); // Hold onto unfinished lines
            
            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const data = JSON.parse(line);
                        handleDataPoint(data);
                    } catch (e) {
                        console.error('Failed to parse line', line, e);
                    }
                }
            }
        }
        
        // Handle remainder
        if (buffer.trim()) {
            try {
                const data = JSON.parse(buffer);
                handleDataPoint(data);
            } catch (e) {}
        }
        
        log('Benchmark execution completed successfully!', 'success');
        saveRunToHistory();
        
    } catch (e) {
        log(`Execution stopped: ${e.message}`, 'error');
        statStatus.textContent = 'Stopped/Error';
        statStatus.style.color = 'var(--danger)';
    } finally {
        isRunning = false;
        btnRun.disabled = false;
        btnStop.disabled = true;
    }
}

// Stop execution
async function stopBenchmark() {
    if (!currentRequestId) return;
    log('Stopping benchmark execution...', 'warning');
    try {
        await fetch(`${API_BASE}/stop/${currentRequestId}`, { method: 'POST' });
        log('Sent stop signal to sandbox.', 'info');
    } catch (e) {
        log(`Failed to stop: ${e.message}`, 'error');
    }
}

// Handle streamed JSON point
function handleDataPoint(data) {
    if (data.status !== 'OK') {
        const errorType = data.status === 'TLE' ? 'Time Limit Exceeded (TLE)' : 'Runtime Error / Memory limit (RE)';
        log(`Terminated point for N = ${Math.round(data.n || 0)}: ${errorType}`, 'error');
        statStatus.textContent = data.status;
        statStatus.style.color = 'var(--danger)';
        return;
    }
    
    const n = Math.round(data.n);
    const time = parseFloat(data.time.toFixed(4));
    const memory = parseFloat(data.memory.toFixed(2));
    
    currentRunData.push({ n, time, memory });
    
    // Update live metrics cards
    statN.textContent = n.toLocaleString();
    statTime.textContent = `${time} ms`;
    statMemory.textContent = `${memory.toLocaleString()} KB`;
    statStatus.textContent = 'RUNNING';
    statStatus.style.color = 'var(--success)';
    
    // Add point to chart
    if (isChartLoaded && chart) {
        chart.data.datasets[0].data.push({ x: n, y: time });
        chart.data.datasets[1].data.push({ x: n, y: memory });
        chart.update('none'); // Update without animation
    } else {
        updateChartFallback();
    }
    
    // Add row to table
    const tr = document.createElement('tr');
    
    // Estimate complexity at current step
    const complexityEst = estimateComplexity(currentRunData);
    
    tr.innerHTML = `
        <td><strong>${n.toLocaleString()}</strong></td>
        <td>${time} ms</td>
        <td>${memory.toLocaleString()} KB</td>
        <td><span style="color: var(--success); font-weight: bold;">OK</span></td>
        <td style="color: var(--secondary); font-weight: 600;">${complexityEst}</td>
    `;
    
    const emptyRow = tableBody.querySelector('.empty-row');
    if (emptyRow) {
        tableBody.removeChild(emptyRow);
    }
    
    tableBody.appendChild(tr);
    tableBody.scrollTop = tableBody.scrollHeight;
    
    log(`Measured N = ${n} | Time = ${time} ms | Memory = ${memory} KB`, 'info');
}

// Save Benchmark to History (LocalStorage)
function saveRunToHistory() {
    if (currentRunData.length === 0) return;
    
    const runs = JSON.parse(localStorage.getItem('zenza_history') || '[]');
    
    const name = prompt("Enter a label/name for this benchmark run to save:", 
        `${langSelect.value.toUpperCase()} Run - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    );
    
    if (name === null) return; // cancelled
    
    const finalName = name.trim() || `Run ${runs.length + 1}`;
    
    const complexity = estimateComplexity(currentRunData);
    
    const runItem = {
        id: 'run_' + Date.now(),
        name: finalName,
        timestamp: new Date().toLocaleString(),
        language: langSelect.value,
        complexity: complexity,
        data: currentRunData,
        code: editor ? editor.getValue() : '',
        schema: schemaNodes
    };
    
    runs.push(runItem);
    localStorage.setItem('zenza_history', JSON.stringify(runs));
    log(`Saved run "${finalName}" to history.`, 'success');
    
    renderHistory();
}

// Render Saved Benchmarks list
function renderHistory() {
    const runs = JSON.parse(localStorage.getItem('zenza_history') || '[]');
    historyItems.innerHTML = '';
    
    if (runs.length === 0) {
        historyItems.innerHTML = '<div class="no-history">No saved runs yet. Complete a benchmark to save.</div>';
        return;
    }
    
    runs.forEach(run => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.dataset.id = run.id;
        
        const info = document.createElement('div');
        info.className = 'history-info';
        info.innerHTML = `
            <span class="history-name">${run.name}</span>
            <span class="history-meta">${run.language.toUpperCase()} | ${run.timestamp} | <strong style="color:var(--secondary)">${run.complexity}</strong></span>
        `;
        
        const actions = document.createElement('div');
        actions.className = 'history-actions';
        
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'btn-icon load';
        toggleBtn.title = 'Overlay on Chart / Load Code';
        toggleBtn.innerHTML = '<i class="ri-refresh-line"></i>';
        toggleBtn.onclick = () => {
            loadHistoryItemToWorkspace(run);
        };
        
        const overlayBtn = document.createElement('button');
        overlayBtn.className = 'btn-icon load';
        overlayBtn.title = 'Overlay Run on Plot';
        overlayBtn.style.color = 'var(--secondary)';
        overlayBtn.innerHTML = '<i class="ri-line-chart-line"></i>';
        overlayBtn.onclick = () => {
            overlayRunOnChart(run);
        };
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-icon delete';
        deleteBtn.title = 'Delete saved run';
        deleteBtn.innerHTML = '<i class="ri-delete-bin-line"></i>';
        deleteBtn.onclick = () => {
            deleteHistoryItem(run.id);
        };
        
        actions.appendChild(overlayBtn);
        actions.appendChild(toggleBtn);
        actions.appendChild(deleteBtn);
        
        item.appendChild(info);
        item.appendChild(actions);
        historyItems.appendChild(item);
    });
}

function deleteHistoryItem(id) {
    let runs = JSON.parse(localStorage.getItem('zenza_history') || '[]');
    runs = runs.filter(r => r.id !== id);
    localStorage.setItem('zenza_history', JSON.stringify(runs));
    renderHistory();
    log('Deleted benchmark from history.', 'info');
}

// Load a past run back into active workspace editor & schema settings
function loadHistoryItemToWorkspace(run) {
    if (editor) {
        editor.setValue(run.code);
        if (isMonacoLoaded && typeof monaco !== 'undefined') {
            monaco.editor.setModelLanguage(editor.getModel(), run.language);
        }
    }
    langSelect.value = run.language;
    schemaNodes = JSON.parse(JSON.stringify(run.schema));
    renderSchema();
    syncXVarOptions();
    
    log(`Loaded "${run.name}" source code and input schemas into workspace.`, 'success');
}

// Overlay historic dataset onto Chart
function overlayRunOnChart(run) {
    if (!isChartLoaded || !chart) {
        log('Visualization is offline. Historical overlays are disabled.', 'warning');
        return;
    }
    
    const labelTime = `${run.name} (Time)`;
    const labelMem = `${run.name} (Mem)`;
    
    const existing = chart.data.datasets.some(d => d.label === labelTime);
    if (existing) {
        chart.data.datasets = chart.data.datasets.filter(d => d.label !== labelTime && d.label !== labelMem);
        chart.update();
        log(`Removed overlay plot: ${run.name}`, 'info');
        return;
    }
    
    const colorSeed = Math.floor(Math.random() * 360);
    const borderColTime = `hsl(${colorSeed}, 85%, 60%)`;
    const borderColMem = `hsl(${(colorSeed + 120) % 360}, 85%, 60%)`;
    
    const timeDataset = {
        label: labelTime,
        data: run.data.map(d => ({ x: d.n, y: d.time })),
        borderColor: borderColTime,
        borderDash: [5, 5],
        borderWidth: 2,
        yAxisID: 'yTime',
        tension: 0.1,
        pointRadius: 2
    };
    
    const memDataset = {
        label: labelMem,
        data: run.data.map(d => ({ x: d.n, y: d.memory })),
        borderColor: borderColMem,
        borderDash: [5, 5],
        borderWidth: 2,
        yAxisID: 'yMemory',
        tension: 0.1,
        pointRadius: 2
    };
    
    chart.data.datasets.push(timeDataset);
    chart.data.datasets.push(memDataset);
    chart.update();
    
    log(`Overlaying plot: "${run.name}" on active chart view.`, 'success');
}

// Clear active Chart
function clearChart() {
    if (isChartLoaded && chart) {
        chart.data.datasets.forEach((dataset, idx) => {
            dataset.data = [];
        });
        chart.data.datasets = chart.data.datasets.slice(0, 2);
        chart.update();
    } else {
        const container = document.getElementById('fallback-bars-container');
        if (container) container.innerHTML = '';
    }
    log('Chart cleared.', 'info');
}

// Toggle Dual axis view vs single
function toggleChartDisplay() {
    if (!isChartLoaded) {
        log('Visualization is offline. Dual axis toggle is disabled.', 'warning');
        return;
    }
    
    if (activeMode === 'dual') {
        activeMode = 'time';
        chart.options.scales.yMemory.display = false;
        chart.data.datasets[1].hidden = true;
        btnToggleTimeMemory.textContent = 'Time Only';
        btnToggleTimeMemory.className = 'btn-sm active-toggle';
        log('Switched view to: Time Complexity only.', 'info');
    } else if (activeMode === 'time') {
        activeMode = 'memory';
        chart.options.scales.yTime.display = false;
        chart.options.scales.yMemory.display = true;
        chart.options.scales.yMemory.position = 'left';
        chart.data.datasets[0].hidden = true;
        chart.data.datasets[1].hidden = false;
        btnToggleTimeMemory.textContent = 'Memory Only';
        log('Switched view to: Memory Complexity only.', 'info');
    } else {
        activeMode = 'dual';
        chart.options.scales.yTime.display = true;
        chart.options.scales.yMemory.display = true;
        chart.options.scales.yMemory.position = 'right';
        chart.data.datasets[0].hidden = false;
        chart.data.datasets[1].hidden = false;
        btnToggleTimeMemory.textContent = 'Dual Axis';
        log('Switched view to: Dual-Axis Complexity view.', 'info');
    }
    chart.update();
}

// Export data to CSV
function exportCSV() {
    if (currentRunData.length === 0) {
        log('No benchmark data to export.', 'warning');
        return;
    }
    
    let csv = 'Variable (N),Execution Time (ms),Memory Usage (KB),Status\n';
    currentRunData.forEach(row => {
        csv += `${row.n},${row.time},${row.memory},OK\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `zenza_benchmark_${langSelect.value}_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    log('CSV file exported successfully.', 'success');
}

// Add Schema Node Buttons Handlers
document.getElementById('btn-add-int').onclick = () => {
    schemaNodes.push({
        id: uniqueId(),
        type: 'int',
        name: `var_n_${schemaNodes.length + 1}`,
        min: '0',
        max: '1000'
    });
    renderSchema();
    syncXVarOptions();
    log('Added Integer field to input schema.', 'info');
};

document.getElementById('btn-add-array').onclick = () => {
    schemaNodes.push({
        id: uniqueId(),
        type: 'array',
        name: `arr_${schemaNodes.length + 1}`,
        size: 'n',
        sorted: false,
        elementType: {
            type: 'int',
            min: '0',
            max: '100'
        }
    });
    renderSchema();
    log('Added Array field to input schema.', 'info');
};

document.getElementById('btn-add-repeat').onclick = () => {
    schemaNodes.push({
        id: uniqueId(),
        type: 'repeat',
        times: '5',
        input: {
            input: []
        }
    });
    renderSchema();
    log('Added Repeat block to input schema.', 'info');
};

// Bind elements listeners
btnRun.onclick = runBenchmark;
btnStop.onclick = stopBenchmark;
btnClearTerminal.onclick = clearTerminal;
btnClearChart.onclick = clearChart;
btnToggleTimeMemory.onclick = toggleChartDisplay;
btnExportCsv.onclick = exportCSV;

templateSelect.onchange = (e) => {
    loadTemplate(e.target.value);
};

langSelect.onchange = (e) => {
    if (editor && isMonacoLoaded && typeof monaco !== 'undefined') {
        monaco.editor.setModelLanguage(editor.getModel(), e.target.value);
    }
};

// Note: This frontend codebase was written and designed by AI.
// The banner warning element has been removed from the visible UI, but the logic is retained here.
function initAIWarning() {
    const banner = document.getElementById('ai-warning-banner');
    const closeBtn = document.getElementById('close-ai-warning');
    
    if (!banner || !closeBtn) return;
    
    if (localStorage.getItem('zenza_ai_warning_dismissed') === 'true') {
        banner.style.display = 'none';
        return;
    }
    
    closeBtn.addEventListener('click', () => {
        banner.style.opacity = '0';
        banner.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            banner.style.display = 'none';
            localStorage.setItem('zenza_ai_warning_dismissed', 'true');
        }, 300);
    });
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initChart();
    initMonaco();
    renderHistory();
    initAIWarning();
    
    // Heartbeat to check backend status every 5 seconds
    checkBackend();
    setInterval(checkBackend, 5000);
});
