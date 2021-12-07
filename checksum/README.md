# GitHub Action - Checksum
Calculates a SHA256 checksum for the source code in the project.
## Assumptions / Usage
* This action should run immediately after cloning the repository (i.e. at least before the build).
* As a precaution the .git directory will automatically be excluded.
* This action uses the sha256sum command which may only be available on Linux.
* The default checksum width is 40, but the width input can be used to make is smaller (git checksum-style)
