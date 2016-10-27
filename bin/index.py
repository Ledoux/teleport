import click
import os
import sys

# import utils
sys.path.append(os.path.join('/'.join(__file__.split('/')[:-1]), '../utils'))

from kubeconfig.kubectl_actions import *

def _get_output_cli(command):
    """
    Process shell command line and return output
    """
    c = command.split(' ')
    p = subprocess.Popen(c, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out, err = p.communicate()
    return out

@click.group(invoke_without_command=False)
def cli():
    print "Welcome to teleport python-side !"
    pass

@cli.group(invoke_without_command=False)
def service():
    """Control all services registered in the infra"""
    pass

@service.command('ports')
def service_ports():
    """Return available ports"""
    print kubectl_ports()

@service.command('register')
@click.argument('servicepath')
def service_register(servicepath):
    """Register a service into the database"""
    kubectl_register(servicepath)

@service.command('status')
@click.option('--ressources', help='List of ressources to display', default='rc, pods')
@click.option('--all-namespaces', help='Looking at all namespaces', default=True)
def service_status(ressources, all_namespaces):
    """Prints the status of all services"""
    print kubectl_status(ressources, all_namespaces)

@service.command('logs')
@click.argument('servicename')
@click.option('-f', is_flag=True, help='Follow logs, like tail -f', default=False)
def service_logs(servicename, f):
    """Get the full log of a service"""
    print kubectl_logs(servicename, f)

@service.command('restart')
@click.argument('servicename')
def service_restart(servicename):
    """Restarts a service"""
    kubectl_stop(servicename)
    kubectl_start(servicename)

@service.command('stop')
@click.argument('servicename')
def service_stop(servicename):
    """Stops a service"""
    kubectl_stop(servicename)

@service.command('start')
@click.argument('servicename')
def service_start(servicename):
    """Starts a service"""
    kubectl_start(servicename)

@service.command('connect')
@click.argument('servicename')
def service_connect(servicename):
    """Connect into a running service container"""
    kubectl_connect(servicename)

@service.command('inspect')
@click.argument('servicename')
def service_inspect(servicename):
    """Get the running configuration of a service container"""
    print kubectl_describe(servicename)

if __name__ == '__main__':
    cli()
