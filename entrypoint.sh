#!/bin/sh -l

echo "Got $1"
echo ::set-output name=_WORD::$1
echo ::set-env name=_WORD::$1