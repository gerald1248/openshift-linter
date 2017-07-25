#!/bin/sh

application=$1

if [ -z "$application" ]; then
  application="openshift-linter"
fi
oc delete is,dc,bc,rc,svc,cm --all
oc replace "template/${application}" -f template.json
