# Remove Conflicting Packages
This is a workaround for a limitation of GitHub Packages for Maven. It won't allow 'mvn deploy' to overwrite existing,
non-SNAPSHOT packages. Unfortunately, we need to do this pretty frequently when we promote a release to evaluation for
regression testing. Sometimes we find issues and have to rebuild/redeploy.

This idea behind this action is that if the evaluation, patch, or master branch is building it'll remove any existing
versions or if there's only one version the whole package. The specific version must exist for anything to get deleted.

This action should happen after the build/test step, but before deploy.

There's no need for this action to run on development builds.

The action scans the source files for pom.xml files. Parses them for interesting data like groupId, artifactIds, etc.,
then uses the GH API to get package/version info and delete them if necessary.

## Inputs

## `auth_token`

**Required** An auth token which has package remove privs.

## `version`

**Required** The package version of interest.

## Example usage
      - name: Remove Package Conflicts
        uses: uw-it-sis/actions/removeConflictingArtifacts@master
        with:
          auth_token: ${{ secrets.CI_ACCESS_TOKEN }}
          version: 1.2.0