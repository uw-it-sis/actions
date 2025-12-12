'use strict';

const assert = require("chai").assert;

const { validateIdenticalVersions } = require('../src/validateVersions');

const PACKAGES = [ "foo", "bar", "biz" ];

const MISMATCH_TESTS = [
    {
        name: 'One version different',
        testData: [
            {
                name: "root",
                versions: [
                    { name: "foo", version: "1.0.0" },
                    { name: "bar", version: "1.0.0" },
                    { name: "biz", version: "1.0.0" }
                ]
            },
            {
                name: "foo",
                versions: [
                    { name: "foo", version: "1.0.0" },
                    { name: "bar", version: "1.0.0" },
                    { name: "biz", version: "2.0.0" }
                ]
            }
        ]
    },

    {
        name: 'Mulitple differences',
        testData: [
            {
                name: "root",
                versions: [
                    { name: "foo", version: "1.0.0" },
                    { name: "bar", version: "1.5.0" },
                    { name: "biz", version: "1.0.1" }
                ]
            },
            {
                name: "foo",
                versions: [
                    { name: "foo", version: "1.0.0" },
                ]
            },
            {
                name: "bar",
                versions: [
                    { name: "bar", version: "1.5.1" },
                ]
            },
            {
                name: "biz",
                versions: [
                    { name: "biz", version: "1.0.2" },
                ]
            }
        ]
    },

    {
        name: 'All libs one version different',
        testData: [
            {
                name: "root",
                versions: [
                    { name: "foo", version: "1.0.1" },
                    { name: "bar", version: "1.0.1" },
                    { name: "biz", version: "2.0.0" }
                ]
            },
            {
                name: "foo",
                versions: [
                    { name: "foo", version: "1.0.1" },
                ]
            },
            {
                name: "bar",
                versions: [
                    { name: "bar", version: "1.0.2" },
                ]
            },
            {
                name: "biz",
                versions: [
                    { name: "biz", version: "2.0.0" }
                ]
            }

        ]
    }
];

const MATCHING_TESTS = [
    {
        name: "No content 1",
        testData: undefined
    },

    {
        name: "No content 2",
        testData: []
    },

    {
        name: "No content 3",
        testData: [
            {}
        ]
    },

    {
        name: "One set of versions",
        testData: [
            {
                name: "root",
                versions: [
                    { name: "foo", version: "1.0.0" },
                    { name: "bar", version: "1.0.0" },
                    { name: "biz", version: "1.0.0" }
                ]
            }
        ]
    },

    {
        name: "Equal versions",
        testData: [
            {
                name: "root",
                versions: [
                    { name: "foo", version: "4.0.8" },
                    { name: "bar", version: "3.0.7" },
                    { name: "biz", version: "2.0.6" }
                ]
            },

            {
                name: "foo",
                versions: [
                    { name: "foo", version: "4.0.8" },
                ]
            },

            {
                name: "bar",
                versions: [
                    { name: "bar", version: "3.0.7" },
                ]
            },

            {
                name: "biz",
                versions: [
                    { name: "biz", version: "2.0.6" },
                ]
            }
        ]
    },

    {
        name: "Equal versions including other packages",
        testData: [
            {
                name: "root",
                versions: [
                    { name: "foo", version: "4.0.8" },
                    { name: "bar", version: "3.0.7" },
                    { name: "biz", version: "2.0.6" },
                    { name: "baz", version: "1.2.3" },
                    { name: "boz", version: "4.5.6" }
                ]
            },

            {
                name: "foo",
                versions: [
                    { name: "foo", version: "4.0.8" },
                ]
            },

            {
                name: "bar",
                versions: [
                    { name: "bar", version: "3.0.7" },
                ]
            },

            {
                name: "biz",
                versions: [
                    { name: "biz", version: "2.0.6" },
                ]
            }
        ]
    },

    {
        name: "Equal unconventional versions",
        testData: [
            {
                name: "root",
                versions: [
                    { name: "foo", version: "GREEN_EGGS_N_HAM" },
                    { name: "bar", version: "4.2.3.1.0.RC-5.alpha" },
                    { name: "biz", version: "@" }
                ]
            },

            {
                name: "foo",
                versions: [
                    { name: "foo", version: "GREEN_EGGS_N_HAM" },
                    { name: "bar", version: "4.2.3.1.0.RC-5.alpha" },
                    { name: "biz", version: "@" }
                ]
            }
        ]
    }
];

describe(`versions discovered should be accurately compared for equality`, function() {

    describe(`test mismatching versions`, function() {
        MISMATCH_TESTS.forEach(test => {
            it(`should have issues for ${test.name}`, async function () {
                let issues = validateIdenticalVersions(test.testData, PACKAGES);
                assert.isFalse(issues.length === 0);
            })
        });
    });

    describe(`test matching versions`, function() {
        MATCHING_TESTS.forEach(test => {
            it(`should not have issues for ${test.name}`, async function() {
                let issues = validateIdenticalVersions(test.testData, PACKAGES);
                assert.isTrue(issues.length === 0);
            })
        });
    });

});