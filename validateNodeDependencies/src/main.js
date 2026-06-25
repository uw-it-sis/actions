'use strict';

/*
 * This file will check the package.json file for the folder it is run in and any standard siscloud libraries found
 * under node_modules.
 *
 * It must be run from a Javascript application folder assumed to have already been built by npm.
 */
const fs = require('node:fs');
const core = require('@actions/core');
const {validateIdenticalVersions} = require("./validateVersions");

const CHECKED_PACKAGES = [
    '@uw-it-sis/lib-js-common',
    '@uw-it-sis/lib-react',
    '@uw-it-sis/lib-react-myplan',
    '@uw-it-sis/lib-lambda',
    '@uw-it-sis/lib-lambda-myplan',
    'react-router-dom',
];

function main() {
    // Take the repo path as the named action input, the first command line argument, or default to cwd if not given.
    let workingDir = core.getInput("workdir");
    if (!workingDir) {
        workingDir = process.argv[2] ?? process.cwd();
    }
    process.chdir(workingDir);
    console.log(`Validating dependencies for repo: `, workingDir);

    let packageLockJson = {};
    try {
        const rawInput = fs.readFileSync(`package-lock.json`);
        packageLockJson = JSON.parse(rawInput);
    } catch (e) {
        core.setFailed(`Error loading package-lock.json: ${e.message}`);
    }

    // search through the keys in the "packages" field to find any entries for the checked packages
    let discoveredVersions = [];
    if (packageLockJson.packages) {
        Object.keys(packageLockJson.packages).forEach(packagePath => {
            CHECKED_PACKAGES.forEach((checkedPackage) => {
                if (packagePath && packagePath.length > 0 && packagePath.endsWith(checkedPackage)) {
                    discoveredVersions.push({ name: checkedPackage, version: packageLockJson.packages[packagePath].version });
                }
            });
        });
    }

    // any entry for any of the packages in consideration should have exactly one version number.
    // if any other version number is found for a given package, fail the build
    const validationIssues = validateIdenticalVersions(discoveredVersions, CHECKED_PACKAGES);

    if (validationIssues.length > 0) {
        core.error(`${validationIssues.length} issues found:`);

        validationIssues.forEach(issue => {
            // core.setFailed will mark this run as a failure
            core.setFailed(`Dependency version mismatch for this module: ${issue.module} , versions discovered: ${issue.versions}`);
            console.log();
        });
    } else {
        core.info("No dependency mismatches found.");
    }

}

main();
