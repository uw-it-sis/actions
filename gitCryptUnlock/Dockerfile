FROM ubuntu:20.04

RUN apt-get update
RUN apt-get install -y git-crypt

COPY LICENSE README.md /

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]