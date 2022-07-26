'use strict';

const _ = require('underscore');
const Issue = require('./Issue');


/**
 * A valid config file should have the following structure:
 *   <section>:
 *     <config_item>:
 *        description: "..."
 *        value: "..."
 *
 * These rules must be true:
 *   - sections may not be empty
 *   - config_items must have description and value properties
 *   - description and value fields must not be empty
 *   - config_items may not have other properties
 *
 * @param {Config} config - A Config object
 * @returns {array<Issue>} A list of Issues
 */
function validateStructure(config) {
    let data = config.data
    let errors = [];
    let isBlank = (i) => _.isNull(i) || _.isUndefined(i);

    // Validate sections
    _.forEach(data, (configItems, sectionName) => {
        // Make sure the section isn't empty
        if (_.isEmpty(configItems)) {
            errors.push(`Empty section: ${sectionName}`);
        } else if (! _.isObject(configItems)) {
            errors.push(`Children of section [${sectionName}] must be config items! Expected [object], found [${typeof configItems}]`);
        } else {

            // Validate config items
            _.forEach(configItems, (itemProperties, configItemName) => {
                let configItemPath = `${sectionName}.${configItemName}`;

                // Validate description
                if (! _.has(itemProperties, 'description')) {
                    errors.push(`Config item [${configItemPath}] does not have a description`);
                }
                // Don't accidentally include both errors
                else if (isBlank(itemProperties.description)) {
                    errors.push(`Config item [${configItemPath}] has an empty description`);
                }

                // Validate value
                if (! _.has(itemProperties, 'value')) {
                    errors.push(`Config item [${configItemPath}] does not have a value`);
                }
                // Don't accidentally include both errors
                else if (isBlank(itemProperties.value)) {
                    errors.push(`Config item [${configItemPath}] has an empty value`);
                }

                // Make sure there aren't other properties on config items
                _.forEach(itemProperties, (val, prop) => {
                    if (!['description', 'value'].includes(prop)) {
                        errors.push(`Invalid property found on config item [${configItemPath}]: ${prop}`);
                    }
                });
                
            });
        }
    });

    return errors.map(e => new Issue(config.file, e));
}

/**
 * Compares a set of configs to make sure they all contain the same set of config items.
 * The goal is to catch any mistakes where someone creates some config items in
 * dev, but forgets to add equivalent configs to prod.
 * @param {list[object]} configSets - A list of objects. Objects should have a "file" property containing the name of the file, and a "data" property containing the parsed data for that file.
 * @returns {array<Issue>} A list of Issues
 */
function validateMatchingConfigItems(configSets) {
    /*
     * Converts the config data to a list of config item paths
     */
    function configDataToConfigPaths(data) {
        let paths = [];
        _.forEach(data, (configItemObject, sectionName) => {
            _.forEach(configItemObject, (_, configItemName) => {
                paths.push(`${sectionName}.${configItemName}`);
            })
        });
        return paths;
    }

    let pathConfigSets = configSets.map(c => ({
        file: c.file,
        paths: configDataToConfigPaths(c.data)
    }));

    let issues = [];
    pathConfigSets.forEach(i => {
        pathConfigSets.forEach(j => {
            if (i.file == j.file) {
                return;
            }
            let difference = _.difference(i.paths, j.paths);
            if (difference.length > 0) {
                issues.push(new Issue(
                    j.file,
                    `Config mismatch: File [${j.file}] was missing ${difference.length} config items found in in [${i.file}]: [${difference}]`
                ));
            }
        });
    });

    return issues;
}


module.exports.validateStructure = validateStructure;
module.exports.validateMatchingConfigItems = validateMatchingConfigItems;
