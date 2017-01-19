# encoding: utf-8

import rethinkdb as r
import arrow
import yaml
import time

RETHINK_HOST = 'localhost'
RETHINK_PORT = 28015
RETHINK_DATABASE = 'infraservices'
RETHINK_TABLE = 'services'

def rethink_connect(database):
  """
  Returns the connection object to the rethink host.
  Connection to the rethink database host.
  """
  max_attempts = 5
  n_attempts = 0
  while n_attempts < max_attempts:
      try:
          return r.connect(host=RETHINK_HOST, port=RETHINK_PORT, db=database)
      except:
          n_attempts += 1
          print 'Attempt ' + str(n_attempts) + ' Error'
          time.sleep(2)

      if n_attempts == max_attempts:
          raise Exception("Could not connect to rethink database {}:{}".format(RETHINK_HOST, RETHINK_PORT))

def _create_table():
  conn = rethink_connect(RETHINK_DATABASE)
  try:
    r.table_create(RETHINK_TABLE, primary_key='name').run(conn)
  except Exception as e:
    pass
  conn.close()

def get_data_yaml(filename):
  datafile = yaml.load_all(open(filename, 'r'))
  data = [d for d in datafile]
  return data

def register_data(raw_data):
    conn = rethink_connect(RETHINK_DATABASE)

    for data in raw_data:
      # parse data infos
      last_update = arrow.now().isoformat()
      data_name = data.get('metadata')['name']
      data_type = data.get('kind').lower()
      data_server = data.get('spec').get('template')
      if data_server:
          server_name = data_server.get('spec').get('nodeName', '')
      else:
          server_name = ''

      # looking for an existing entry in the db
      table_obj = r.table(RETHINK_TABLE).filter({'name': data_name}).run(conn)
      res_tmp = [obj for obj in table_obj]
      if res_tmp: # If found then update the document
        res_tmp = res_tmp[0]
        res_tmp[data_type] = data
        res_tmp['server'] = server_name
        res_tmp['lastupdate'] = last_update
        r.table(RETHINK_TABLE).insert(res_tmp, conflict='replace').run(conn)
      else: # If not found create a document
        rd = {
          'name': data_name,
          'server': server_name,
          'lastupdate': last_update
        }
        rd[data_type] = data
        r.table(RETHINK_TABLE).insert(rd, conflict='replace').run(conn)

    conn.close()

def get_data(name):
  conn = rethink_connect(RETHINK_DATABASE)
  table_obj = r.table(RETHINK_TABLE).filter({'name': name}).run(conn)
  res = [obj for obj in table_obj][0]
  conn.close()
  return res

def get_all_names():
  conn = rethink_connect(RETHINK_DATABASE)
  table_obj = r.table(RETHINK_TABLE).get_field('name').run(conn)
  res = [obj for obj in table_obj]
  conn.close()
  return res
