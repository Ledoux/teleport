import click
import os
import sys

# import utils
sys.path.append(os.path.join('/'.join(__file__.split('/')[:-1]), '../src'))

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

@cli.command('ports')
@click.option('--filter', help='filter ports given the used ones or the available ones', default='used')
@click.option('--docker', help='name of the docker ie the little name of the server')
def ports(filter, docker):
    """Return ports"""
    print kubectl_used_ports(docker) if filter == 'used' else kubectl_available_ports(docker)

@cli.command('register')
@click.argument('servicepath')
def register(servicepath):
    """Register a service into the database"""
    kubectl_register(servicepath)

@cli.command('status')
@click.option('--ressources', help='List of ressources to display', default='rc, pods')
@click.option('--all-namespaces', help='Looking at all namespaces', default=True)
def status(ressources, all_namespaces):
    """Prints the status of all services"""
    print kubectl_status(ressources, all_namespaces)

@cli.command('logs')
@click.argument('servicename')
@click.option('-f', is_flag=True, help='Follow logs, like tail -f', default=False)
def logs(servicename, f):
    """Get the full log of a service"""
    print kubectl_logs(servicename, f)

@cli.command('restart')
@click.argument('servicename')
def restart(servicename):
    """Restarts a service"""
    kubectl_stop(servicename)
    kubectl_start(servicename)

@cli.command('stop')
@click.argument('servicename')
def stop(servicename):
    """Stops a service"""
    kubectl_stop(servicename)

@cli.command('start')
@click.argument('servicename')
def start(servicename):
    """Starts a service"""
    kubectl_start(servicename)

@cli.command('connect')
@click.argument('servicename')
def connect(servicename):
    """Connect into a running service container"""
    kubectl_connect(servicename)

@cli.command('inspect')
@click.argument('servicename')
def inspect(servicename):
    """Get the running configuration of a service container"""
    print kubectl_describe(servicename)

if __name__ == '__main__':
    cli()
