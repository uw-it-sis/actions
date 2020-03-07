#!/bin/sh -l

echo "Got $1"
echo ::set-output name=_SUBWORD::$1
echo ::set-env name=_SUBWORD::$1