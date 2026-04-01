import subprocess
import tempfile
import uuid
import os
from containers.const import TIMEOUT, TCERROR

from ..base import Container

class CppContainer(Container):
    def __init__(self, code: str):
        super().__init__(code)
        self.executable_file_name = str(uuid.uuid4())
        with tempfile.NamedTemporaryFile(mode='w', suffix='.cpp') as f:
            f.write(code)
            f.flush()
            try:
                subprocess.run(
                    ['g++', f.name, '-o', self.executable_file_name],
                    capture_output=True,
                    text=True,
                    check=True
                )

            except subprocess.CalledProcessError as e:
                return 'Compilation Error'

        self.command = [f'./{self.executable_file_name}']
        
    def close(self):
        os.remove(f'./{self.executable_file_name}')
        return super().close()