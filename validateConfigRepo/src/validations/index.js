'use strict';

/*
 * Validations barrel file for cleaner imports/exports
 */

// const {validateValueContents} = require('./validateValueContents');
const {validateStructure} = require('./validateStructure');
const {validateMatchingConfigItems} = require('./validateMatchingConfigItems');

module.exports.validateStructure = validateStructure;
module.exports.validateMatchingConfigItems = validateMatchingConfigItems;
// module.exports.validateValueContents = validateValueContents;
