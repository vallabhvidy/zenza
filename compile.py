import resource
import subprocess
import time
import os
import logging
from models.code import Code

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)

logger = logging.getLogger(__name__)


def compileCpp(code: Code, output_file_name: str) -> str:
    logger.info("Starting compilation")

    with open('temp.cpp', 'w') as f:
        f.write(code.code)

    try:
        result = subprocess.check_output(
            ['g++', 'temp.cpp', '-o', output_file_name],
            stderr=subprocess.STDOUT,
            text=True
        )
        logger.info("Compilation successful")
        return result

    except subprocess.CalledProcessError as e:
        logger.error("Compilation failed")
        logger.error(e.output)
        raise


def limit_resources():
    logger.info("Applying resource limits")

    resource.setrlimit(resource.RLIMIT_CPU, (3, 3))

    memory_limit = 256 * 1024 * 1024  
    resource.setrlimit(resource.RLIMIT_AS, (memory_limit, memory_limit))

    resource.setrlimit(
        resource.RLIMIT_FSIZE,
        (10 * 1024 * 1024, 10 * 1024 * 1024)
    )

    os.sched_setaffinity(0, {0})


def executeCpp(output_file_name: str, input_data: str = '') -> float:
    logger.info(f"Executing binary: {output_file_name}")

    start = time.perf_counter()
    start_usage = resource.getrusage(resource.RUSAGE_CHILDREN)

    try:
        subprocess.run(
            ['./' + output_file_name],
            input=input_data,
            text=True,
            preexec_fn=limit_resources,
            timeout=3,
            stdout=subprocess.DEVNULL
        )

    except subprocess.TimeoutExpired:
        logger.error("Execution timed out")
        return -1

    except subprocess.CalledProcessError as e:
        logger.error("Execution failed")
        logger.error(e.output)
        return -1

    end_usage = resource.getrusage(resource.RUSAGE_CHILDREN)
    end = time.perf_counter()

    cpu_time = (
        end_usage.ru_utime - start_usage.ru_utime
    ) + (
        end_usage.ru_stime - start_usage.ru_stime
    )

    wall_time = end - start

    logger.info(f"Execution finished | CPU time: {cpu_time:.6f}s | Wall time: {wall_time:.6f}s")

    return cpu_time