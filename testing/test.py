import subprocess
import tempfile
import os
import time

def compile_cpp(code):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".cpp") as f:
        f.write(code.encode())
        cpp_file = f.name

    exe_file = cpp_file.replace(".cpp", "")

    compile_process = subprocess.run(
        ["g++", cpp_file, "-O2", "-std=c++17", "-o", exe_file],
        capture_output=True,
        text=True
    )

    if compile_process.returncode != 0:
        print("Compilation Error:")
        print(compile_process.stderr)
        return None

    return cpp_file, exe_file


def run_test(exe_file, input_data):
    start = time.time()

    process = subprocess.run(
        [exe_file],
        input=input_data,
        capture_output=True,
        text=True,
        timeout=5  # prevent infinite loops
    )

    end = time.time()

    return {
        "output": process.stdout,
        "error": process.stderr,
        "time": end - start
    }


# ==========================
# Example Usage
# ==========================

cpp_code = """
#include <bits/stdc++.h>
using namespace std;
int main(){
    int n;
    cin >> n;
    cout << n*n << endl;
}
"""

compiled = compile_cpp(cpp_code)

if compiled:
    cpp_file, exe_file = compiled

    test_ns = [10, 100, 1000, 10000]

    for n in test_ns:
        input_data = f"{n}\n"
        result = run_test(exe_file, input_data)

        print("n =", n)
        print("Output:", result["output"].strip())
        print("Time:", result["time"])
        print("-" * 30)

    os.remove(cpp_file)
    os.remove(exe_file)
