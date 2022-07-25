'use strict';

const _ = require('underscore');


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
 * @param {object} data - the json object parsed from the yaml config
 * @returns {object} An object with 2 properties:
 *  result - True/false whether the structure was valid
 *  errors - a list of errors found. Will be empty if result was true.
 */
function validateStructure(data) {

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

    return {
        result: errors.length == 0,
        errors,
    }
}


module.exports.validateStructure = validateStructure;
