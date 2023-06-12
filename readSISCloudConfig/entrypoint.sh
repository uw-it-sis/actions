#!/bin/bash -l
#================================================================================

# Export an env-var by going:
#    VAR_NAME=value >> $GITHUB_ENV
#
# This jq block declares several vars in one go
jq -r '
  "CLOUD_PROFILE=" + .cloud_profile ,
  "COLLECTIVE=" + .collective ,
  "BLOC=" + .bloc
' .siscloud.json >> "$GITHUB_ENV"