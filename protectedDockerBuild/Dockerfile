# Container image that runs your code
FROM alpine:3.10

# Copies your code file from your action repository to the filesystem path `/` of the container
COPY entrypoint.sh /entrypoint.sh

# Install bash, so that the shell code is consistent.
RUN apk -v --update add --no-cache \
        bash \
        git \
        docker

#  Code file to execute when the docker container starts up (`entrypoint.sh`)
ENTRYPOINT ["/bin/bash", "/entrypoint.sh"]