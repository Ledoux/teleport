# encoding: utf-8

import subprocess
import os

def _get_output_cli(command):
    '''
    Process shell command line and return output
    '''
    c = command.split(' ')
    p = subprocess.Popen(c, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out, err = p.communicate()
    return out

def create(filepath):
    print filepath
    out = _get_output_cli('kubectl create -f ' + filepath)
    print out

def delete(filepath):
    out = _get_output_cli('kubectl delete -f ' + filepath)
    print out

def status(ressources, all_namespaces):
    format_ressources = ressources.replace(' ', '')
    all_namespaces_flag = ''
    if all_namespaces:
        all_namespaces_flag = '--all-namespaces'
    out = _get_output_cli('kubectl get ' + format_ressources + ' ' + all_namespaces_flag)
    return out

def nodes():
    os.system('kubectl get nodes')

def pods_name_from_label(label):
    out = os.popen("kubectl get pods --selector=k8s-app=" + label + " -o wide | tail -n +2").read()
    return out

def found_pods_and_exec_func(service_name, func):
  pods = pods_name_from_label(service_name)
  pods_list = filter(lambda x: x != '', pods.split('\n'))
  if not pods_list:
    print 'No pods found'
    return
  elif len(pods_list) > 1:
    format_list = '\n'.join(pods_list) + '\n\nName: '
    answer = raw_input('Multiple pods under this service, please choose one by selecting the name: \n' + format_list)
    return func(answer)
  else:
    pod_name = pods_list[0].split(' ')[0]
    return func(pod_name)

def logs(pod_name, f):
    if f:
        out = os.system('kubectl logs -f ' + pod_name)
    else:
        out = _get_output_cli('kubectl logs ' + pod_name)
        return out

def describe(pod_name):
    out = _get_output_cli('kubectl describe pods ' + pod_name)
    return out

def connect(pod_name):
    os.system('kubectl exec ' + pod_name + ' -it -- bash')
