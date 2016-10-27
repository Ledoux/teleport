#
# IMPORTS
#
import os
import subprocess
import sys

#
# ENVIRONMENT
#
if len(sys.argv) > 0:
    TARGET_DIR = sys.argv[1]
else:
    TARGET_DIR = os.environ.get(
        'FOLDER_DIR',
        "/".join(__file__.split('/')[:-1]) + '/../..'
    ) + "/backend/webrouter"
LIB = "lib"
MODULES = "modules"
PREFIX = "._symlink_"

folderNames = [LIB,MODULES]

is_symlinking = False

#
# MAP MV
#
for folderName in folderNames:
    sub_dir = TARGET_DIR + '/' + folderName
    if os.path.exists(sub_dir):
        if is_symlinking:
            symlinked_paths = filter(
                lambda path:
                path.split('/')[-1] != "*",
                subprocess.Popen(
                    [
                        "find",
                        sub_dir,
                        "-maxdepth",
                        "1",
                        "-type",
                        "l"
                    ],
                    stdout = subprocess.PIPE
                ).communicate()[0].split('\n')[:-1]
            )
            for symlinked_path in symlinked_paths:
                symlinked_chunks = symlinked_path.split('/')
                symlinked_dir = "/".join(symlinked_chunks[:-1])
                symlinked_name = symlinked_chunks[-1]
                subprocess.Popen(
                    [
                        "rsync",
                        "-r",
                        "`readlink " + symlinked_path + "`",
                        symlinked_dir + "/_sym_" + symlinked_name
                    ],
                    stdout = subprocess.PIPE
                ).communicate()[0]
        else:
            symlinked_names = filter(
                lambda sub_dirs:
                sub_dirs[:len(PREFIX)] == PREFIX,
                os.listdir(sub_dir)
            )
            for symlinked_name in symlinked_names:
                target_dir = sub_dir + "/" + PREFIX.join(
                    symlinked_name.split(PREFIX)[1:]
                )
                subprocess.Popen(
                    [
                        "rm",
                        "-r",
                        target_dir,
                    ],
                    stdout = subprocess.PIPE
                ).communicate()[0]
                subprocess.Popen(
                    [
                        "mv",
                        sub_dir + "/" + symlinked_name,
                        target_dir
                    ],
                    stdout = subprocess.PIPE
                ).communicate()[0]
