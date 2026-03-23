import sys

n = int(sys.stdin.read().strip())

total = 0
for i in range(n):
    for j in range(n):
        total += 1

print(total)