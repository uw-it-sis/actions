FROM ubuntu:latest

RUN apt-get update && apt-get install -y git-crypt

COPY LICENSE README.md /

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]