#!/bin/bash

echo "This will run django with uwsgi serving up all static files."
echo "Use this for testing the site in prod mode without needing"
echo "to run nginx or a reverse proxy on your host."

source ${BASH_SOURCE%/*}/functions.sh

run_django_server

uwsgi --http 127.0.0.1:8888 --static-map /static=./static/ --static-map /media=./media/ --master --module core.wsgi:application

echo "Now point your browser to: http://localhost:49360"
