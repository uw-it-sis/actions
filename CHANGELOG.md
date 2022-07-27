# Changelog
This document is meant to document the changes that are introduced in a particular release.
The versioning convention for this module is ...
* Releases that can be consumed without changing build code only increment the patch version.
* Releases that contain breaking changes should increment the minor version.
* Releases that introduce foundational changes increment the major version. (The term "foundational"
changes isn't well-defined at the time of writing, but I'm thinking of it as "very breaky" changes.)

Entries should be grouped under the following subheadings: Added, Changed, Deprecated, Removed, Fixed, Security

This document generally follows the formatting here: https://keepachangelog.com/en/1.0.0

## [ Unreleased ]
### Added
* TBD
### Fixed
* TBD
### Security
* Just
* listing
### Changed
* the
### Deprecated
* possibilities

## [ 1.1.0 ]
### Added
* validateConfigRepo action - validates that config-* yaml configs are valid

## [ 1.0.1 ]
### Changed
* stageArtifact: Updated to stage patch artifacts in both dev and eval artifacts buckets

## [ 1.0.0 ]
### Added
* Actions to deploy JS artifacts on dev builds
* Checksum generator