'use strict'

/**
 * @typeDef {object} VersionEntry
 * @property {string} name
 * @property {string} version
 */

/**
 * @typedef {object} ValidationIssue
 * @property {string} module
 * @property {string[]} versions
 */

/**
 * Validate that the versions within the incoming VersionEntry for the given set of packages
 * are all the same.
 *
 * @param {VersionEntry[]} packageVersions A collection of VersionEntry objects containing discovered version data
 * @param {string[]} packages list of packages for validation comparison
 *
 * @return {ValidationIssue[]} an array of validation issues describing mismatches, which is empty if all discovered versions are matching.
 */
function validateIdenticalVersions(packageVersions, packages) {

    if (!packageVersions || packageVersions.length === 0) {
        return [];
    }

    const validationIssues = [];

    // for any of the given packages, there should be either 0 or 1 unique value for the version string across all the data
    // so if any version is discovered to be not equal to a non-empty value recorded here, the entry is considered a mismatch
    const discoveredVersions = {};
    for (const p of packages) {
        discoveredVersions[p] = {
            version: "",
        };
    }

    // check all versions for only the given set of packages
    for (const entry of packageVersions.filter(e => packages.includes(e.name))) {
        const discoveredVersion = discoveredVersions[entry.name].version;
        if (discoveredVersion.length === 0) {
            discoveredVersions[entry.name] = { name: entry.name, version: entry.version };
        }
        else {
            if (discoveredVersion !== entry.version) {
                validationIssues.push({
                    module: entry.name,
                    versions: `${discoveredVersion} , ${entry.version}`
                });
            }
        }
    }

    return validationIssues;

}


module.exports.validateIdenticalVersions = validateIdenticalVersions;