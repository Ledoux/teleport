# encoding: utf-8

import json
import time
from kubectl_data import *
from kubectl_ports import *
from kubectl_wrapper import *

TMP_FILEPATH = '/tmp/'

def create_tmp_json(data, service_path):
  with open(service_path, 'w') as out:
    json.dump(data, out, indent=2)

def sub_start(service_name, data, kube_type):
  filepath = TMP_FILEPATH + service_name + '-' + kube_type + '.json'
  kube_data = data.get(kube_type, dict())
  create_tmp_json(kube_data, filepath)
  create(filepath)

def sub_stop(service_name, data, kube_type):
  filepath = TMP_FILEPATH + service_name + '-' + kube_type + '.json'
  kube_data = data.get(kube_type, dict())
  create_tmp_json(kube_data, filepath)
  delete(filepath)

'''
Actions
'''
def kubectl_used_ports(subdomain):
    return get_used_ports(subdomain)

def kubectl_available_ports(subdomain):
    return get_available_ports(subdomain)

def kubectl_register(filepath):
  data = get_data_yaml(filepath)
  register_data(data)

def kubectl_start(service_name):
  data = get_data(service_name)
  sub_start(service_name, data, 'service')
  time.sleep(1)
  sub_start(service_name, data, 'replicationcontroller')

def kubectl_stop(service_name):
  data = get_data(service_name)
  sub_stop(service_name, data, 'replicationcontroller')
  sub_stop(service_name, data, 'service')
  time.sleep(1)

def kubectl_list():
  return get_all_names()

def kubectl_startall():
  services = get_all_names()
  for service in services:
    kubectl_start(service)

def kubectl_status(ressources, all_namespaces):
  return status(ressources, all_namespaces)

def kubectl_status_nodes():
  return nodes()

def kubectl_logs(service_name, f):
  pods = pods_name_from_label(service_name)
  pods_list = filter(lambda x: x != '', pods.split('\n'))
  if not pods_list:
    print 'No pods found'
    return
  elif len(pods_list) > 1:
    format_list = '\n'.join(pods_list) + '\n\nName: '
    answer = raw_input('Multiple pods under this service, please choose one by selecting the name: \n' + format_list)
    return logs(answer, f)
  else:
    pod_name = pods_list[0].split(' ')[0]
    return logs(pod_name, f)

def kubectl_describe(service_name):
  found_pods_and_exec_func(service_name, describe)

def kubectl_connect(service_name):
  found_pods_and_exec_func(service_name, connect)
