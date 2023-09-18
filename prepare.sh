#!/bin/bash

if [ "$1" == "dev" ]
then
    echo "Preparing files for development environment"
    cp .clasp-dev.json .clasp.json
elif [ "$1" == "prd" ] 
then
    echo "Preparing files for production environment"
    cp .clasp-prd.json .clasp.json
else
    echo "Usage: prepare [dev|prd]"
    exit 1
fi
