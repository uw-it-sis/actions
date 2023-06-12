const _ = require('underscore');
const Issue = require('../Issue');

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

module.exports.validateMatchingConfigItems = validateMatchingConfigItems;
