#!/bin/sh

# git doesn't like the ownership on the directory when running in docker, so tell it not to worry
git config --global --add safe.directory '*'

echo "$GPG_PRIVATE_KEY" | base64 -d > "$HOME"/git-crypt-key.asc

gpg --batch --import "$HOME"/git-crypt-key.asc

gpgconf -v --kill gpg-agent
printf "kill gpg-agent\ n"

gpg-agent -v --daemon --allow-preset-passphrase --max-cache-ttl 3153600000
printf "start gpg-agent\ n"

/usr/lib/gnupg/gpg-preset-passphrase -v --preset --passphrase "$GPG_KEY_PASS" "$GPG_KEY_GRIP"
printf "set gpg-preset-passphrase\ n"

git-crypt unlock

rm "$HOME"/git-crypt-key.asc