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

const createArraySchema = (maxN: string, sorted = false): TemplateSchemaNode => ({
  type: 'input',
  children: [
    { type: 'int', name: 'n', min: '1', max: maxN },
    { 
      type: 'array', 
      name: 'A', 
      size: 'n', 
      sorted: sorted, 
      elementType: { type: 'int', name: 'element', min: '1', max: '100' } 
    }
  ]
});

const EXPONENTIAL_SCHEMA: TemplateSchemaNode = {
  type: 'input',
  children: [
    { type: 'int', name: 'n', min: '1', max: '40' }
  ]
};

export const TEMPLATES: Template[] = [
  {
    id: 'o1',
    name: 'O(1) Constant',
    complexity: 'O(1)',
    schema: {
      type: 'input',
      children: [
        { type: 'int', name: 'n', min: '1', max: '300000' }
      ]
    },
    python: `import sys

def main():
    lines = sys.stdin.read().split()
    if not lines:
        return
    n = int(lines[0])
    
    # O(1) operation: basic constant-time arithmetic
    result = (n ^ 0x5F3759DF) & 1
    print(result)

if __name__ == '__main__':
    main()
`,
    cpp: `#include <iostream>

int main() {
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(NULL);
    int n;
    if (!(std::cin >> n)) return 0;
    
    // O(1) operation: basic constant-time arithmetic
    int result = (n ^ 0x5F3759DF) & 1;
    std::cout << result << std::endl;
    return 0;
}
`
  },
  {
    id: 'ologn',
    name: 'O(log N) Logarithmic',
    complexity: 'O(log N)',
    schema: {
      type: 'input',
      children: [
        { type: 'int', name: 'n', min: '1', max: '300000' }
      ]
    },
    python: `import sys

def main():
    lines = sys.stdin.read().split()
    if not lines:
        return
    n = int(lines[0])
    
    # O(log N) operation: divide n by 2 until it reaches 0
    steps = 0
    temp = n
    while temp > 0:
        steps += 1
        temp //= 2
    print(steps)

if __name__ == '__main__':
    main()
`,
    cpp: `#include <iostream>

int main() {
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(NULL);
    int n;
    if (!(std::cin >> n)) return 0;
    
    // O(log N) operation: divide n by 2 until it reaches 0
    int steps = 0;
    int temp = n;
    while (temp > 0) {
        steps++;
        temp /= 2;
    }
    std::cout << steps << std::endl;
    return 0;
}
`
  },
  {
    id: 'on',
    name: 'O(N) Linear',
    complexity: 'O(N)',
    schema: createArraySchema('150000'),
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
    name: 'O(N log N) Log-Linear',
    complexity: 'O(N log N)',
    schema: {
      type: 'input',
      children: [
        { type: 'int', name: 'n', min: '1', max: '300000' }
      ]
    },
    python: `import sys

def main():
    lines = sys.stdin.read().split()
    if not lines:
        return
    n = int(lines[0])
    
    # O(N log N) operation: N iterations, each taking log(i) steps
    ans = 0
    for i in range(1, n + 1):
        temp = i
        while temp > 0:
            ans += temp % 2
            temp //= 2
            
    print(ans)

if __name__ == '__main__':
    main()
`,
    cpp: `#include <iostream>

int main() {
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(NULL);
    int n;
    if (!(std::cin >> n)) return 0;
    
    // O(N log N) operation: N iterations, each taking log(i) steps
    long long ans = 0;
    for (int i = 1; i <= n; ++i) {
        int temp = i;
        while (temp > 0) {
            ans += temp % 2;
            temp /= 2;
        }
    }
    std::cout << ans << std::endl;
    return 0;
}
`
  },
  {
    id: 'on2',
    name: 'O(N²) Quadratic',
    complexity: 'O(N²)',
    schema: createArraySchema('10000'),
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
