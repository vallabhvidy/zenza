import subprocess
import socket
import uuid
import os
from containers.base import Container, stopwatch
import containers.docker_utils as du
import containers.socket_utils as su
import containers.const as const

LANG = 'python'
IMAGE = f'{LANG}_image'
DOCKER = 'podman'

class PythonContainer(Container):
    def __init__(self, code):
        super().__init__(code)

        if not du.does_image_exist(LANG):
            du.build_image(LANG)

        self.port = str(uuid.uuid4())
        self.addr = f'/tmp/sockets/{self.port}'

        try:
            output = subprocess.run(
                [DOCKER, 'run', '--rm', '-i', '-v', '/tmp/sockets:/sockets:z', '-d', IMAGE, self.port]
            )
        except Exception as e:
            raise Exception('[CONTAINER]', e)
        
        self.client = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        self.client.connect(self.addr)
        
        print('[CONNECTING] to container...')

    def run(self, testcase):
        su.send(self.client, testcase)
        reply = su.recieve(self.client)

        time = 0

        if reply == su.TESTCASE_ERROR:
            raise Exception('Invalid testcase format...')

        elif reply == su.TIMEOUT_ERROR:
            return -1

        else:
            try:
                time = float(reply)
            except Exception as e:
                raise Exception('Container did not return time...')
            
        return time
    
    def close(self):
        su.send(self.client, su.DICONNECT_MESSAGE)
        os.remove(self.addr)



class PythonContainerSubprocess(Container):
    def __init__(self, code):
        super().__init__(code)

        if not du.does_image_exist(LANG):
            du.build_image(LANG)

        self.container = subprocess.Popen(
            [DOCKER, 'run', '--rm', '-i', IMAGE],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            text=True
        )

        print('Container is created and process is running...')

        if not self.container.stdin or not self.container.stdout:
            raise Exception("Container pipes not available")

        self.container.stdin.write(code + '\n' + const.END + '\n')
        self.container.stdin.flush()

        output = self.container.stdout.readline()
        if output.strip() == const.SUCCESS:
            print('Code has been passed to container successfully...')

    def run(self, testcase):
            
        assert self.container.stdin 
        assert self.container.stdout

        self.container.stdin.write(testcase + '\n' + const.END + '\n')
        self.container.stdin.flush()
                
        time = self.container.stdout.readline().strip()
        
        if not time:
            raise Exception('Container did not return time...')
        
        if time == const.TIMEOUT:
            return -1
        
        if time == const.TCERROR:
            raise Exception('Invalid testcase format...')
        
        return float(time)
        
    def close(self):
        self.container.terminate()
        self.container.wait()


class PythonContainerLocal(Container):

    def __init__(self, code):
        self.code = code
        pass

    @stopwatch
    def run(self, testcase: str):

        try:
            subprocess.run(
                ['python', '-c', self.code],
                input=testcase,
                text=True,
                timeout=3,
                stdout=subprocess.DEVNULL,
                check=True
            )

        except subprocess.TimeoutExpired:
            return -1

        except subprocess.CalledProcessError as e:
            return -1
    
    def close(self):
        return super().close()
    
