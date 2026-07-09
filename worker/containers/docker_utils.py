import subprocess

def does_image_exist(language):
    output = subprocess.run(
        ['podman', 'image', 'ls', '-q', f'{language}_image'], 
        stdout=subprocess.PIPE,
        text=True
    )
    return (True if output.stdout else False)

def build_image(language):
    if does_image_exist(language):
        return
    
    print(f'Image for {language} does not exist...')
    print('Building image...')

    try: 
        output = subprocess.run(
            ['podman', 'build', '-t', f'{language}_image', f'./worker/containers/{language}'],
        )

    except Exception as e:
        print('Error occured while building Docker file...')
        print(e)

    print(f'Image created : {does_image_exist(language)}')
