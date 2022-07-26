'use strict';

/*
 * This file will look for yaml config files in the repo and validate them.
 * It must be run from the config-* repo root
 */
const yaml = require('js-yaml');
const fs = require('fs');
const _ = require('underscore');

const core = require('@actions/core'); // github actions

const {
    validateStructure,
    validateMatchingConfigItems,
} = require('./validate');
const Config = require('./Config');

function main() {
    console.log(`Running from: `, process.cwd());

    // Find config files
    let configFiles = fs.readdirSync('.')
        .filter(isDir)
        .map(dir => fs.readdirSync(dir).filter(isConfigFile).map(f => `${dir}/${f}`))
        .flat();

    console.log("Found config files: ", configFiles);

    let issues = [];

    // Parse the config files, collecting any parse errors
    let configs = configFiles.map(file => {
        try {
            let configData = yaml.load(fs.readFileSync(file));
            return new Config(file, configData);
        } catch (e) {
            issues.push(new Issue(
                file,
                `YAML parse error: ${e.reason} at line ${e.mark.line}, column ${e.mark.column}`,
            ));
        }
    }).filter(config => !_.isUndefined(config));

    // look for validation issues
    configs.forEach(config => {
        let configIssues = validateStructure(config);
        issues.push(...configIssues);
    });

    // Look for config item mismatches
    let varsFiles = configs.filter(c => isVarFile(c.file));
    let secretsFiles = configs.filter(c => isSecretsFile(c.file));

    let mismatches = [
        ...validateMatchingConfigItems(varsFiles),
        ...validateMatchingConfigItems(secretsFiles),
    ]

    issues.push(...mismatches);

    // let mismatches = validateMatchingConfigItems(varsFiles);

    console.log(`mismatches: `, mismatches)  // TODO DELETE ME

    console.log(`issues: `, issues)  // TODO DELETE ME

    console.log(`groupIssues(issues): `, groupIssues(issues))  // TODO DELETE ME

    // if (issues.length > 0) {
    //     console.error(`${issues.length} issues found:`);
    //     issues.forEach(issue => {
    //         // core.setFailed will mark this run as a failure
    //         core.setFailed(`Config file [${issue.file}] had ${issue.errors.length} error(s):`);
    //         issue.errors.forEach(e => console.error(`    ${e}`));
    //     });
    // } else {
    //     console.log("All config files look valid");
    // }

}

/**
 * Groups issues by file
 */
function groupIssues(issues) {
    return _.chain(issues)
        .groupBy(e => e.file)
        // convert the list of errors from a list of objects to a list of strings.
        .map((errors, file) => {
            return {
                file: file,
                errors: errors.map(e => e.error)
            }
        })
        .value();

}

////////////////////////////////////////////////////////////////////////
//                               UTILS                                //
////////////////////////////////////////////////////////////////////////

function isConfigFile(f) { return isVarFile(f) || isSecretsFile(f); }
function isVarFile(f) { return f.endsWith('variables.yaml'); }
function isSecretsFile(f) { return f.endsWith('secrets.yaml'); }

function isDir(f) { return fs.statSync(f).isDirectory(); }

main();
