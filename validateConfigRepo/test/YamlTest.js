'use strict';

const assert = require("chai").assert;
const _ = require('underscore');

const { validateStructure } = require('../src/validations');

const INVALID_STRUCTURES = [
    {app1: 'bar'}, // not deep enough
    {app2: null}, // config section is empty
    {app3: undefined}, // config section is empty
    {
        app4: {
            bar: "string", // not deep enough + malformed; missing description/value
        }
    },
    {
        app5: {
            bar: null, // not deep engouh; config item is missing description/value
        }
    },
    {
        app6: {
            bar: {
                desc: "foobar", // desc is an invalid 3rd level key
                value: "val",
            }
        }
    },
    {
        app7: {
            bar: {
                description: "foobar",
                val: "val", // val is an invalid 3rd level key
            }
        }
    },
    {
        app8: {
            bar: {
                description: "foobar",
                value: "val",
                alpha: "foo", // alpha is an invalid 3rd level key, and there are 3 keys
                // here. This could happen if there is incorrect indentation.
            }
        }
    },
    {
        app9: {
            bar: {
                description: null, // empty description
                value: "val",
            }
        }
    },
    {
        app10: {
            bar: {
                description: "d",
                value: null, // empty value
            }
        }
    },
]

const VALID_STRUCTURES = [
    {},
    {
        foo: {
            bar: {
                description: "foobar",
                value: "val",
            }
        }
    },
    {
        foo: {
            bar: {
                description: "foobar",
                value: "val",
            },
            alpha: {
                description: "foobar",
                value: "val",
            }
        },
        app2: {
            sws_url: {
                description: "foobar",
                value: "val",
            },
            pws_url: {
                description: "foobar",
                value: "val",
            }
        }
    },
]

describe(`config object should have a valid structure`, function() {

    describe(`test invalid structures`, function() {
        for (let i in _.range(INVALID_STRUCTURES.length)) {
            it(`[${i}]`, async function() {
                let config = {name: "na", data: INVALID_STRUCTURES[i]};
                let issues = validateStructure(config);
                console.error(issues.map(i => i.error));
                assert.isFalse(issues.length == 0);
            });
        }

    });

    it(`test valid structures`, async function() {
        for (let i in _.range(INVALID_STRUCTURES.length)) {
            it(`[${i}]`, async function() {
                let config = {name: "na", data: VALID_STRUCTURES[i]};
                let issues = validateStructure(config);
                console.error(issues.map(i => i.error));
                assert.isTrue(issues.length == 0);
            });
        }

        
    });
    
});
