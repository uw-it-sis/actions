'use strict';

/**
 * An "Issue" binds an error to a file. There can be multiple issues associated with a file.
 */
module.exports = class Issue {
    constructor(file, error) {
        this.file = file;
        this.error = error;
    }
}
