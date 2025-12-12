'use strict';

/*
 * This file will check the package.json file for the folder it is run in and any standard siscloud libraries found
 * under node_modules.
 *
 * It must be run from a Javascript application folder assumed to have already been built by npm.
 */
const fs = require('fs');
const _ = require('underscore');
const core = require('@actions/core');
const {validateIdenticalVersions} = require("./validateVersions");

const CHECKED_PACKAGES = ['lib-js-common', 'lib-react', 'lib-react-myplan', 'lib-lambda', 'lib-lambda-myplan'];

function main() {
    // Take the config repo path as the first argument, or default to cwd if not given.
    let workingDir = process.argv[2] ?? process.cwd();
    process.chdir(workingDir);
    console.log(`Validating dependencies for repo: `, workingDir);

    // find all package files and their paths
    let packageFiles = [
        {
            name: 'root',
            path: `${workingDir}/package.json`
        }
    ];

    if (fs.existsSync("node_modules")) {
        CHECKED_PACKAGES.map(p => ({ name: p, path: `${workingDir}/node_modules/@uw-it-sis/${p}/package.json`}) )
            .filter(f => fs.existsSync(f.path)).forEach(pathData => packageFiles.push(pathData));
    }
    else {
        core.setFailed(`No node_modules found under ${workingDir}`);
        return;
    }

    // Parse the package files and gather a list of dependency versions from each
    const errors = [];
    let discoveredVersions = packageFiles.map(pf => {
        let fileData = {};
        try {
            const rawInput = fs.readFileSync(pf.path);
            fileData = JSON.parse(rawInput);
        } catch (e) {
            errors.push({
                path: pf.path,
                message: `Error loading package.json file: ${e.message}`,
            });
        }

        const versions = [
            {
                name: pf.name,
                version: trimLeadingNonDigit(fileData.version)
            }
        ]

        // if we are looking at the root package.json, also read the versions delcared as dependencies
        if (pf.name === 'root') {
            CHECKED_PACKAGES.forEach(p => {
                if (fileData.dependencies[`@uw-it-sis/${p}`]) {
                    versions.push({
                        name: p,
                        version: trimLeadingNonDigit(fileData.dependencies[`@uw-it-sis/${p}`])
                    });
                }
            });
        }

        return {
            name: pf.name,
            versions: versions
        };
    });

    if (errors.length > 0) {
        for(err of errors) {
            core.setFailed(`Proflem with path: [ ${err.path} ]  , ${err.message}`);
        }
        return;
    }

    // any mention of any of the packages in consideration should have exactly one version number.
    // if any other version number is found for a given package, fail the build
    const validationIssues = validateIdenticalVersions(discoveredVersions, CHECKED_PACKAGES);

    if (validationIssues.length > 0) {
        core.error(`${validationIssues.length} issues found:`);

        validationIssues.forEach(issue => {
            // core.setFailed will mark this run as a failure
            core.setFailed(`Dependency version mismatch between this module path: ${issue.pathOne} and: ${issue.pathTwo} , versions discovered: ${issue.versions}`);
            console.log();
        });
    } else {
        core.info("No dependency mismatches found.");
    }

}

function trimLeadingNonDigit(input) {
    let result = input;
    if (isNaN(Number(result.charAt(0)))) {
        result = result.substring(1);
    }

    return result;
}

main();
