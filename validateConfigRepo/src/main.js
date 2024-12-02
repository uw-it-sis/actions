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
    //validateValueContents,
} = require('./validations');
const Config = require('./Config');
const Issue = require('./Issue');

function main() {
    // Take the config repo path as the first argument, or default to cwd if not given.
    let workingDir = process.argv[2] ?? process.cwd();
    process.chdir(workingDir);
    console.log(`Validating repo: `, workingDir);

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

    // Look for yaml structure issues.
    configs.forEach(config => {
        console.log(`Validating structure of config [${config.file}]...`)
        let configIssues = validateStructure(config);
        issues.push(...configIssues);
    });

    // Look for config item mismatches, i.e. did we forget to declare a var in prod?
    let varsFiles = configs.filter(c => isVarFile(c.file));
    let secretsFiles = configs.filter(c => isSecretsFile(c.file));

    // // TODO: turning this off for now. It's invalid to create empty SSM
    // // parameters, so we will need a way to say "this config item is not needed
    // // in prod"
    // let mismatches = [
    //     ...validateMatchingConfigItems(varsFiles),
    //     ...validateMatchingConfigItems(secretsFiles),
    // ]
    // issues.push(...mismatches);

    /* TODO Disabling this check cuz there's a version compat issue with treesitter.
    // This check looks for dev/eval variables that might've been accidentally
    // committed to prod configs. For now, only check prod variables.
    let prodConfig = configs.find(c => c.file == 'prod/variables.yaml');
    console.log(`Checking [${prodConfig.file}] for invalid prod configs...`)

    // These are strings that should NOT be found in any prod values (unless annotated otherwise)
    const invalidProdValues = ['dev', 'eval', 'test'];
    let prodInvalidValues = validateValueContents(prodConfig, invalidProdValues);
    issues.push(...prodInvalidValues);
    */

    let fileErrors = groupIssuesByFile(issues);

    if (issues.length > 0) {
        core.error(`${issues.length} issues found:`);
        fileErrors.forEach(file => {
            // core.setFailed will mark this run as a failure
            core.setFailed(`Config file [${file.file}] had ${file.errors.length} error(s):`);
            file.errors.forEach(e => core.error(`    ${file.file}: ${e}`));
            console.log();
        });
    } else {
        core.info("All config files look valid");
    }

}

/**
 * Groups issues by file
 * Takes a list of issues, and returns a list of objects. Each object
 * represents a file, and has a "file" prop with the name of the file, and an
 * "errors" prop that contains a list of all of the errors associated with that
 * file.
 * @param {Issue[]} issues - a list of issues
 * @returns - A list of objects that look like this:
 *   {
 *     file: "filename",
 *     errors: [...]
 *   }
 */
function groupIssuesByFile(issues) {
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
