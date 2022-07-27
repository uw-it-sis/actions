FROM ubuntu:latest

RUN apt-get update && apt-get install git-crypt

COPY LICENSE README.md /

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]