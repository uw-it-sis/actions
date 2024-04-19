# Container image that runs your code
FROM alpine:latest

# Install commands needed for the script to run ...
RUN apk add --no-cache bash
RUN apk add --no-cache libxml2-utils
RUN apk add --no-cache curl
RUN apk add --no-cache jq

# Copies your code file from your action repository to the filesystem path `/` of the container
COPY remove.sh /remove.sh

# Code file to execute when the docker container starts up
ENTRYPOINT ["/remove.sh"]