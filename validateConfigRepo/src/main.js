'use strict';

/*
 * This file will look for yaml config files in the repo and validate them.
 */
const yaml = require('js-yaml');
const fs = require('fs');
const {validateStructure} = require('./validate');
const core = require('@actions/core'); // github actions

function isConfigFile(f) { return f == 'variables.yaml' || f == 'secrets.yaml' ; }

function isDir(f) { return fs.statSync(f).isDirectory(); }

console.log(`Running from: `, process.cwd());

// This must be run from the config-* repo root
let configFiles = fs.readdirSync('.')
    .filter(isDir)
    .map(dir => fs.readdirSync(dir).filter(isConfigFile).map(f => `${dir}/${f}`))
    .flat();

console.log("Found config files: ", configFiles);

let results = configFiles.map(file => {
    let configData;
    try {
        configData = yaml.load(fs.readFileSync(file));
    } catch (e) {
        return {
            file,
            result: false,
            errors: [`YAML parse error: ${e.reason} at line ${e.mark.line}, column ${e.mark.column}`],
        }
    }
    let validationResults = validateStructure(configData);
    return {
        file,
        result: validationResults.result,
        errors: validationResults.errors,
    };
});

let failures = results.filter(r => r.result == false);

if (failures.length > 0) {
    console.error(`${failures.length} config files were invalid:`);
    failures.forEach(f => {
        // core.setFailed will mark this run as a failure
        core.warning(`Config file [${f.file}] had ${f.errors.length} error(s):`);
        f.errors.forEach(e => console.error(`    ${e}`));
    });
} else {
    console.log("All config files look valid");
}

