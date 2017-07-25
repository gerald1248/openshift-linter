#!/bin/sh

if [ $# -eq 0 ] || [ $# -eq 1 ] || [ $# -eq 2 ]; then
  echo "Usage: rest.sh <serviceaccount> <method> <query> [<data>]\ne.g. ./rest.sh robot GET /oapi/v1\n"
  exit 0;
fi

serviceaccount=$1
method=$2
query=$3

data=""

if [ $# -eq 4 ]; then
  data="--data ${4}"
fi

# get server
server=`oc status|head -n 1|sed 's/.*\(http\)/\1/'`;

# get token
token_name=`oc get secrets|grep "$serviceaccount-token"|head -n 1|cut -d" " -f1`;
token=`oc describe secret/${token_name}|grep "^token"|sed 's/^token://'|tr -d '[:space:]'`;

curl -X $method -H "Authorization: Bearer ${token}" "${server}${query}" --insecure $data
