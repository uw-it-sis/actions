'use strict';

/*
 * This file will check the package.json file for the folder it is run in and any standard siscloud libraries found
 * under node_modules.
 *
 * It must be run from a Javascript application folder assumed to have already been built by npm.
 */
const fs = require('fs');
const core = require('@actions/core');
const {validateIdenticalVersions} = require("./validateVersions");

const UW_PACKAGE_GROUP = "@uw-it-sis";
const CHECKED_PACKAGES = ['lib-js-common', 'lib-react', 'lib-react-myplan', 'lib-lambda', 'lib-lambda-myplan'];

function main() {
    // Take the config repo path as the first argument, or default to cwd if not given.
    let workingDir = process.argv[2] ?? process.cwd();
    process.chdir(workingDir);
    console.log(`Validating dependencies for repo: `, workingDir);

    let fileData = {};
    try {
        const rawInput = fs.readFileSync(`${workingDir}/package-lock.json`);
        fileData = JSON.parse(rawInput);
    } catch (e) {
        core.setFailed(`Error loading [ ${workingDir}/package-lock.json ] : ${e.message}`);
    }

    // search through the keys in the "packages" field to find any entries for the checked packages
    let discoveredVersions = [];
    if (fileData.packages) {
        Object.keys(fileData.packages).forEach(packageName => {
            CHECKED_PACKAGES.forEach((checkedPackage) => {
                if (packageName && packageName.length > 0 && packageName.endsWith(`${UW_PACKAGE_GROUP}/${checkedPackage}`)) {
                    discoveredVersions.push({ name: checkedPackage, version: fileData.packages[packageName].version });
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
