#!/usr/bin/env python
# -*- coding: utf-8 -*-

#
# IMPORTS
#
import os
import sys
if 'WEBSERVICES_DIR' in os.environ:
    file_dir = "/".join(__file__.split('/')[:-1])
    if file_dir == "":
        file_dir = os.getcwd()
    host_dir = file_dir + "/../"
    sys.path.append(host_dir)
    os.environ['HOST_DIR'] = host_dir
    __import__('webrouter')
import rethinkdb as r
import subprocess
from subprocess import Popen, PIPE, STDOUT
from webrouter import app
from webrouter.lib.data import get_data_by_table_name

#
# CONFIG
#
if len(sys.argv) > 1:
    database_name = sys.argv[1]
else:
    print "YOU MUST SPECIFY A DATABASE AS THE FIRST ARG"
IS_WARNING = True

#
# ENVIRONMENT
#
database = app.config['databases_by_name'][database_name]
tables = database.get('tables', list())
HOST = app.config['databases_by_name'][database_name]['host']
PORT = app.config['databases_by_name'][database_name]['port']
FORMAT =  os.environ.get('FORMAT', 'json')
FROM = os.environ.get('FROM', 'localhost')
S3_BUCKET = os.environ.get('S3_BUCKET', "snips-backup")
if database_name == 'doc':
    S3_DATA_BUCKET = "rethink-thedoc"
else:
    S3_DATA_BUCKET = "rethink-" + database_name
S3_SCHEDULER_BUCKET = os.environ.get('S3_SCHEDULER_BUCKET', 'daily')
S3_PATH = "s3://" + S3_BUCKET + "/" + S3_DATA_BUCKET + "/" + S3_SCHEDULER_BUCKET
S3_TIMESTAMP = os.environ.get('S3_TIMESTAMP', '2016-10-04T06-10-03')

#
# RETHINK
#
conn = r.connect(host = HOST, port = PORT)
# Set the db
database_names = r.db_list().run(conn)
if database_name not in database_names:
    current_db = r.db_create(database_name).run(conn)
current_db = r.db(database_name)
# Grab the tables
table_names = current_db.table_list().run(conn)

#
# JSON DATA
#
if FORMAT == 'json':
    data_dir = host_dir + 'data/json_data/'
    data_by_table_name = get_data_by_table_name(data_dir)
elif FORMAT == 'gz':
    data_dir = host_dir + 'data/rethinkdb_data/'
    gz_names_by_table_name = dict(map(
        lambda name:
        [name.split('.')[1:2][0], name],
        filter(lambda _dir: '.' in _dir, os.listdir(data_dir))
    ))

#
# RESTORE
#
for table in tables:
    new_table_name = table['name']
    is_initiating = table.get('is_initiating', False)
    if new_table_name in table_names:
        # Maybe we want to reset it totally
        # So if the table object has the item is_initiating to True
        # we drop and create a new one with the same config
        if is_initiating:
            # But first let inform people !!!
            # And make sure that they want to do that
            if IS_WARNING:
                is_confirming_drop = raw_input(
                     "\n".join([
                    "\n***********************",
                    'WARNING',
                    "***********************",
                    "Database is " + database_name,
                    "You are about to drop/restore the " + new_table_name + " table ",
                    "ARE YOU SURE ? (MAYBE NOT if it is a table in seeds db notably...) [y/n]: "
                    ])
                ) == "y"
            else:
                is_confirming_drop = True
            # We drop
            if is_confirming_drop:
                if FORMAT == 'json':
                    current_db.table_drop(new_table_name).run(conn)
                    current_db.table_create(new_table_name).run(conn)
    else:
        current_db.table_create(new_table_name).run(conn)

    # Now we either insert the json or restore via the tar
    if is_confirming_drop:
        if FORMAT == 'json':
            # print
            print "\n*** INSERT IN RETHINK ***"
            # We get the table
            current_table = current_db.table(new_table_name)
            # We add maybe other configs
            if 'index_keys' in table:
                for index_key in table['index_keys']:
                    current_table.index_create(index_key).run(conn)
            # We add data
            if new_table_name in data_by_table_name:
                current_table.insert(data_by_table_name[new_table_name]).run(conn)
        elif FORMAT == 'gz':
            # We need maybe first to download from s3
            if FROM == 's3':
                print "\n*** UPLOAD FROM S3 ***"
                file_name = S3_TIMESTAMP + "-" + S3_DATA_BUCKET + "-" + database_name + "." + new_table_name + ".tar.gz"
                s3_file_path = os.path.join(S3_PATH, file_name)
                command = " && ".join([
                    "cd " + data_dir,
                    "aws s3 cp " + s3_file_path + " " + file_name + " --profile snips"
                ])
                print command
                subprocess.call(command, shell=True)
            elif FROM == 'localhost':
                file_name = gz_names_by_table_name[new_table_name]

            # untar
            print "\n*** UNTAR ***"
            command = " && ".join([
                "cd " + data_dir,
                "tar -zxvf " + file_name
            ])
            print command
            p = Popen(command, shell=True, stdin=PIPE, stdout=PIPE, stderr=STDOUT, close_fds=True)
            output = p.stdout.read()
            untar_name = output.split(' ')[-1].replace('\n', '')
            print "untar_name", untar_name

            # restore
            print "\n*** RESTORE ***"
            command = "rethinkdb restore --force "
            command += os.path.join(data_dir, untar_name)
            command += " -c \"" + HOST + ":" + str(PORT) + "\""
            print command
            subprocess.call(command, shell=True)

            # rm
            print "\n*** RM ***"
            command = "rm " + os.path.join(data_dir, untar_name)
            print command
            subprocess.call(command, shell=True)

#
# CLOSE
#
conn.close()
