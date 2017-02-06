# Uwsgi issues with MacOS 10.11 El Capitan
https://github.com/unbit/uwsgi/issues/1364

## Environment
- MacOS 10.11 El Capitan
- `brew` and `pip` are installed

## Description
You were trying to create a teleport app but uwsgi complained about a linking issue like so
```
*** uWSGI linking ***
    clang -o [...]

ld: file not found: /usr/lib/system/libsystem_symptoms.dylib for architecture x86_64
clang: error: linker command failed with exit code 1 (use -v to see invocation)
*** error linking uWSGI ***
```

The issue seems to be related to `libxml2` where a symlink is missing.

## Solution
We unlink and uninstall `libxml2` then reinstall it with option `--with-python` to get the proper symlinks.
```
brew unlink libxml2
brew uninstall libxml2
brew install --with-python libxml2
brew link libxml2 --force
```

Possibly it might work just running the command
```
brew install --with-python libxml2
```

## Why it's important
Uwsgi is one of the core feature of several templates on teleport, it's used to manage python servers in a nice way.
