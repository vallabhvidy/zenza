export type Complexity = 'o1' | 'ologn' | 'on' | 'onlogn' | 'on2' | 'o2n';

export interface TemplateSchemaNode {
  type: 'int' | 'float' | 'array' | 'repeat' | 'input';
  name?: string;
  min?: string;
  max?: string;
  size?: string;
  sorted?: boolean;
  elementType?: any;
  children?: TemplateSchemaNode[];
  times?: string;
  input?: any;
}

export interface Template {
  id: Complexity;
  name: string;
  complexity: string;
  python: string;
  cpp: string;
  schema: TemplateSchemaNode;
}

const DEFAULT_ARRAY_SCHEMA: TemplateSchemaNode = {
  type: 'input',
  children: [
    { type: 'int', name: 'n', min: '1', max: '10' },
    { 
      type: 'array', 
      name: 'A', 
      size: 'n', 
      sorted: false, 
      elementType: { type: 'int', name: 'element', min: '1', max: '100' } 
    }
  ]
};

const SORTED_ARRAY_SCHEMA: TemplateSchemaNode = {
  type: 'input',
  children: [
    { type: 'int', name: 'n', min: '1', max: '10' },
    { 
      type: 'array', 
      name: 'A', 
      size: 'n', 
      sorted: true, 
      elementType: { type: 'int', name: 'element', min: '1', max: '100' } 
    }
  ]
};

const EXPONENTIAL_SCHEMA: TemplateSchemaNode = {
  type: 'input',
  children: [
    { type: 'int', name: 'n', min: '1', max: '10' }
  ]
};

export const TEMPLATES: Template[] = [
  {
    id: 'o1',
    name: 'O(1) Constant',
    complexity: 'O(1)',
    schema: DEFAULT_ARRAY_SCHEMA,
    python: `import sys

def main():
    lines = sys.stdin.read().split()
    if not lines:
        return
    n = int(lines[0])
    arr = [int(x) for x in lines[1:n+1]]
    
    # O(1) operation: access the first element
    result = arr[0] if arr else 0
    print(result)

if __name__ == '__main__':
    main()
`,
    cpp: `#include <iostream>
#include <vector>

int main() {
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(NULL);
    int n;
    if (!(std::cin >> n)) return 0;
    std::vector<int> arr(n);
    for (int i = 0; i < n; ++i) {
        std::cin >> arr[i];
    }
    // O(1) operation: access the first element
    std::cout << (n > 0 ? arr[0] : 0) << std::endl;
    return 0;
}
`
  },
  {
    id: 'ologn',
    name: 'O(log N) Logarithmic',
    complexity: 'O(log N)',
    schema: SORTED_ARRAY_SCHEMA,
    python: `import sys

def binary_search(arr, target):
    low = 0
    high = len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1

def main():
    lines = sys.stdin.read().split()
    if not lines:
        return
    n = int(lines[0])
    arr = [int(x) for x in lines[1:n+1]]
    
    # O(log N) operation: binary search for a fixed element
    # Note: Requires a sorted array, which our loaded schema automatically configures.
    result = binary_search(arr, 50)
    print(result)

if __name__ == '__main__':
    main()
`,
    cpp: `#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(NULL);
    int n;
    if (!(std::cin >> n)) return 0;
    std::vector<int> arr(n);
    for (int i = 0; i < n; ++i) {
        std::cin >> arr[i];
    }
    // O(log N) operation: binary search on a sorted vector
    // Note: Requires a sorted array, which our loaded schema automatically configures.
    bool found = std::binary_search(arr.begin(), arr.end(), 50);
    std::cout << (found ? "Found" : "Not Found") << std::endl;
    return 0;
}
`
  },
  {
    id: 'on',
    name: 'O(N) Linear',
    complexity: 'O(N)',
    schema: DEFAULT_ARRAY_SCHEMA,
    python: `import sys

def main():
    lines = sys.stdin.read().split()
    if not lines:
        return
    n = int(lines[0])
    arr = [int(x) for x in lines[1:n+1]]
    
    # O(N) operation: find maximum value
    max_val = 0
    for val in arr:
        if val > max_val:
            max_val = val
    print(max_val)

if __name__ == '__main__':
    main()
`,
    cpp: `#include <iostream>
#include <vector>

int main() {
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(NULL);
    int n;
    if (!(std::cin >> n)) return 0;
    std::vector<int> arr(n);
    for (int i = 0; i < n; ++i) {
        std::cin >> arr[i];
    }
    // O(N) operation: find maximum value
    int max_val = 0;
    for (int val : arr) {
        if (val > max_val) max_val = val;
    }
    std::cout << max_val << std::endl;
    return 0;
}
`
  },
  {
    id: 'onlogn',
    name: 'O(N log N) Sorting',
    complexity: 'O(N log N)',
    schema: DEFAULT_ARRAY_SCHEMA,
    python: `import sys

def main():
    lines = sys.stdin.read().split()
    if not lines:
        return
    n = int(lines[0])
    arr = [int(x) for x in lines[1:n+1]]
    
    # O(N log N) operation: TimSort
    arr.sort()
    print(arr[n // 2] if n > 0 else 0)

if __name__ == '__main__':
    main()
`,
    cpp: `#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(NULL);
    int n;
    if (!(std::cin >> n)) return 0;
    std::vector<int> arr(n);
    for (int i = 0; i < n; ++i) {
        std::cin >> arr[i];
    }
    // O(N log N) operation: std::sort (IntroSort)
    std::sort(arr.begin(), arr.end());
    std::cout << (n > 0 ? arr[n / 2] : 0) << std::endl;
    return 0;
}
`
  },
  {
    id: 'on2',
    name: 'O(N²) Quadratic',
    complexity: 'O(N²)',
    schema: DEFAULT_ARRAY_SCHEMA,
    python: `import sys

def main():
    lines = sys.stdin.read().split()
    if not lines:
        return
    n = int(lines[0])
    arr = [int(x) for x in lines[1:n+1]]
    
    # O(N²) operation: nested loop comparison sum
    sum_val = 0
    for i in range(n):
        for j in range(n):
            sum_val += (arr[i] * arr[j]) % 100
    print(sum_val)

if __name__ == '__main__':
    main()
`,
    cpp: `#include <iostream>
#include <vector>

int main() {
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(NULL);
    int n;
    if (!(std::cin >> n)) return 0;
    std::vector<int> arr(n);
    for (int i = 0; i < n; ++i) {
        std::cin >> arr[i];
    }
    // O(N²) operation: nested loop comparison sum
    long long sum_val = 0;
    for (int i = 0; i < n; ++i) {
        for (int j = 0; j < n; ++j) {
            sum_val += (1LL * arr[i] * arr[j]) % 100;
        }
    }
    std::cout << sum_val << std::endl;
    return 0;
}
`
  },
  {
    id: 'o2n',
    name: 'O(2^N) Exponential',
    complexity: 'O(2^N)',
    schema: EXPONENTIAL_SCHEMA,
    python: `import sys

def fib(val):
    if val <= 1:
        return val
    return fib(val - 1) + fib(val - 2)

def main():
    lines = sys.stdin.read().split()
    if not lines:
        return
    n = int(lines[0])
    
    result = fib(n)
    print(result)

if __name__ == '__main__':
    main()
`,
    cpp: `#include <iostream>

long long fib(int val) {
    if (val <= 1) return val;
    return fib(val - 1) + fib(val - 2);
}

int main() {
    int n;
    if (!(std::cin >> n)) return 0;
    
    std::cout << fib(n) << std::endl;
    return 0;
}
`
  }
];
