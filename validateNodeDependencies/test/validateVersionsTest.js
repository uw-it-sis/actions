'use strict';

const assert = require("chai").assert;

const { validateIdenticalVersions } = require('../src/validateVersions');

const PACKAGES = [ "foo", "bar", "biz" ];

const MISMATCH_TESTS = [
    {
        name: 'One version different',
        testData: [
            { name: "foo", version: "1.0.0" },
            { name: "bar", version: "1.0.0" },
            { name: "biz", version: "1.0.0" },
            { name: "biz", version: "2.0.0" }
        ]
    },

    {
        name: 'Multiple differences',
        testData: [
            { name: "foo", version: "1.0.0" },
            { name: "bar", version: "1.5.0" },
            { name: "biz", version: "1.0.1" },
            { name: "bar", version: "1.5.1" },
            { name: "biz", version: "1.0.2" }
        ]
    },

    {
        name: 'Many unchecked different, only one checked different',
        testData: [
            { name: "foo", version: "1.0.1" },
            { name: "f00", version: "5.0.0" },
            { name: "f00", version: "5.5.0" },
            { name: "---", version: "5.0.0" },
            { name: "---", version: "0.0.0" },
            { name: "007", version: "0.0.7" },
            { name: "007", version: "1.0.7" },
            { name: "bar", version: "1.0.1" },
            { name: "foo", version: "1.0.2" },
            { name: "biz", version: "2.0.0" }
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
            { name: "foo", version: "1.0.0" },
            { name: "bar", version: "1.0.0" },
            { name: "biz", version: "1.0.0" }
        ]
    },

    {
        name: "Multiple entries but all equal versions",
        testData: [
                { name: "foo", version: "4.0.8" },
                { name: "bar", version: "3.0.7" },
                { name: "foo", version: "4.0.8" },
                { name: "bar", version: "3.0.7" },
                { name: "biz", version: "2.0.6" },
                { name: "biz", version: "2.0.6" },
        ]
    },

    {
        name: "Equal versions including other non-matching packages",
        testData: [
                { name: "foo", version: "4.0.8" },
                { name: "bar", version: "3.0.7" },
                { name: "biz", version: "2.0.6" },
                { name: "baz", version: "1.2.3" },
                { name: "boz", version: "4.5.6" },
                { name: "boz", version: "1" },
                { name: "fie", version: "X" },
                { name: "fie", version: "Y" }
        ]
    },

    {
        name: "Equal unconventional versions",
        testData: [
            { name: "foo", version: "GREEN_EGGS_N_HAM" },
            { name: "bar", version: "4.2.3.1.0.RC-5.alpha" },
            { name: "biz", version: "@" },
            { name: "foo", version: "GREEN_EGGS_N_HAM" },
            { name: "bar", version: "4.2.3.1.0.RC-5.alpha" },
            { name: "biz", version: "@" }
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