'use strict';

/**
 * "Roughly" represents a config file
 */
module.exports = class Config {
    constructor(file, data) {
        /**
         * The name of the config file we're looking at.
         */
        this.file = file;
        /**
         * The data found in the config file. Use a yaml parser to convert the raw yaml into a json object.
         */
        this.data = data;
    }
}
