from containers.containerize import containers

import os

code = ''
with open('testing/test2.py', 'r') as f:
    code = f.read()

print(f'{code=}')

container = containers['python'](code)

print('Container created...')
testcase = input('Testcase : ')

time_to_run = container.run(testcase)
print(f'Time to run testcase : {time_to_run}')

