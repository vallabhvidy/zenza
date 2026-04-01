import subprocess
import socket
import uuid
import os
import time
import json
from containers.base import Container
import containers.docker_utils as du
import containers.socket_utils as su
import containers.const as const

LANG = 'python'
IMAGE = f'{LANG}_image'
DOCKER = 'podman'
SOCKET_DIR = '/tmp/sockets'
RETRY = 100
DELAY = 0.1

class PythonContainerDocker(Container):
    def __init__(self, code):
        super().__init__(code)

        self.image_check()

        self.port: str = str(uuid.uuid4())
        self.addr: str = f'/tmp/sockets/{self.port}'
        self.container_id: bytes
        self.client: socket.socket

        print('[CONTAINER] port :', self.port)
        print('[CONTAINER] address :', self.addr)
        
        self.create_container()
        self.connect_to_container()
        self.send_code_to_container(code)

    def image_check(self):
        if not du.does_image_exist(LANG):
            du.build_image(LANG)

    def create_container(self):
        try:
            os.makedirs(SOCKET_DIR, exist_ok=True)
            command = [DOCKER, 'run', '--rm', '-v', f'{SOCKET_DIR}:/sockets:z', '-d', IMAGE, self.port]
            
            output = subprocess.run(command)

            self.container_id = output.stdout

            print('[CONTAINER] container id :', self.container_id)
        except Exception as e:
            raise Exception('[CONTAINER]', e)
        
    def connect_to_container(self):
        self.client = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)

        for _ in range(RETRY):
            try: 
                self.client.connect(self.addr)
                break
            except OSError:
                print('[SOCKET] socket not yet created retrying after 0.1s...')
                time.sleep(DELAY)
        else:
            print('[SOCKET] socket not created in the given time buffer...')
            raise Exception('[SOCKET] error...')
        
        print('[CONNECTING] to container...')

    def send_code_to_container(self, code):
        print('[CODE] sending code to container...')
        su.send(self.client, code)
        
    # Function to pass testcase to a container and return its output
    def run(self, testcase) -> dict:
        print('[REQUEST] recieved request for testcase with length :', len(testcase))
        su.send(self.client, testcase)

        length = int(su.receive(self.client, const.HEADER))
        output = su.receive(self.client, length)

        print('[REPLY] output :', output)
        print('[REPLY] length of reply by the container is', length)

        output = json.loads(output)

        if output['status'] == su.TESTCASE_ERROR:
            raise Exception('Invalid testcase format...')
            
        return output
    
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


class PythonContainer(Container):

    def __init__(self, code):
        super().__init__(code)
        self.command = ['python', '-c', code]

    def close(self):
        return super().close()
    
