'use strict';

module.exports = class Issue {
    constructor(file, error) {
        this.file = file;
        this.error = error;
    }
}
