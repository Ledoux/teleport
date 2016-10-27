import subprocess
import json
import random

def _get_output_cli(command):
    """
    Process shell command line and return output
    """
    c = command.split(' ')
    p = subprocess.Popen(c, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out, err = p.communicate()
    return out

def port_parser(ports):
    res = list()
    for p in ports:
        target_port = p.get('targetPort')
        port = p.get('port')
        d = {
            'containerPort': target_port,
            'externalPort': port
        }
        res.append(d)
    return res

def get_ports(server='prod2'):
    """
    Get ports for all services related to an infra server
        - server: the server name ('prod2', 'dev3', ...)

    Return format:
        {
            'serviceName': [
                {
                    'externalPort': 8016,
                    'containerPort': 8016
                },
                ...
            ]
        }
    """
    pods_data = _get_output_cli("kubectl get pods -o json")
    pods_jdata = json.loads(pods_data)
    names = list()
    for item in pods_jdata.get('items', list()):
        spec = item.get('spec')
        name = spec.get('containers')[0]['name']
        node = spec.get('nodeName')
        if server == node.split('.')[0]:
            names.append(name)

    services_data = _get_output_cli("kubectl get services -o json")
    services_jdata = json.loads(services_data)
    results = dict()
    for item in services_jdata.get('items', list()):
        spec = item.get('spec')
        sel = spec.get('selector')
        selector = sel.get('k8s-app') if sel else ''
        ports = spec.get('ports')
        if selector in names:
            results[selector] = port_parser(ports)
    return results

def get_used_ports():
    res = get_ports()
    used_ports = []
    for service_name, service_configs in res.items():
        for  service_config in service_configs:
            if 'containerPort' in service_config:
                used_ports.append(service_config['containerPort'])
            if 'containerPort' in service_config:
                used_ports.append(service_config['externalPort'])
    return used_ports

def get_available_webservices_ports():
    available_ports = list(set(range(9700, 9800)) - set(get_used_ports()))
    available_ports.sort()
    random.shuffle(available_ports)
    return available_ports[:2]
