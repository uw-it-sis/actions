# Container image that runs your code
FROM alpine:latest

# Copies your code file from your action repository to the filesystem path `/` of the container
COPY removeConflictingArtifacts.sh /removeConflictingArtifacts.sh

# Code file to execute when the docker container starts up
ENTRYPOINT ["/removeConflictingArtifacts.sh"]