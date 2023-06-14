'use strict';

const core = require('@actions/core'); // github actions
const github = require('@actions/github'); // github actions
const ServicesClient = require('@uw-it-sis/lib-lambda/lib/ServicesClient');
const BasicHttpClient = require('@uw-it-sis/lib-lambda/lib/BasicHttpClient');
const {readFileSync} = require('fs');

async function main() {

    // Gather inputs. They come from various places depending on the running context.
    const config = gatherInputs();

    // Create a client
    let client;
    let baseUrl;
    switch (config.environment) {
        case 'local':
            baseUrl = process.env.BASE_URL;
            client = new BasicHttpClient();

            break;

        default:
            baseUrl = `https://api.theclaw${config.envExtension}.sis.uw.edu`;
            client = new ServicesClient( {
                idpUrl:       `https://auth.api.theclaw${config.envExtension}.sis.uw.edu/oauth2/token`,
                clientId:     core.getInput("client_id", {required: true}),
                clientSecret: core.getInput("client_secret", {required: true}),
            });
    }

    // Send the callback to The Claw
    const url = `${baseUrl}/theclaw/${config.bloc}/${config.collective}/builds/${config.commithash}/${config.status}`
    try {
        await client.doPut(url, {}); // No body to send, all of the info is in the URL
    } catch (e) {
        console.log(`Error during build callback to The Claw: `, e);
    }
}

async function gatherInputs() {
    // Which version of The Claw are we calling against?
    //
    // Supported values: "prod", "dev", "local"
    const environment = process.env.THECLAW_ENVIRONMENT ?? 'prod';

    // Status of the build - "success" or "failure".
    const status = core.getInput("status", {required: true});

    // The commit hash that triggered this build.
    const commithash = github.context.sha;
    const envExtension = environment == "dev" ? "-dev" : "";

    // In a real build, config and bloc should come out of the .siscloud.json config file, but for local and dev builds,
    // support getting them out of env-vars for testing.
    let collective, bloc;
    if (environment == "prod") {
        let data, siscloudConfig;
        try {
            data = readFileSync(f);
            siscloudConfig = JSON.parse(data)
        } catch (e) {
            throw new Error(`Could not read/parse config file ${f}: ${e}`);
        }
        collective = siscloudConfig.collective;
        bloc = bloc.collective;
    } else {
        collective = process.env.COLLECTIVE;
        bloc = process.env.BLOC;
    }

    if (!collective) {
        throw new Error("Error, collective is missing or undefined");
    }

    if (!bloc) {
        throw new Error("Error, bloc is missing or undefined");
    }

    return {
        environment,
        status,
        commithash,
        envExtension,
        collective,
        bloc,
    }
}

/**
 * Returns undefined if file could not be read
 */
function safeReadJsonFile(f) {
    let data, json;
    try {
        data = readFileSync(f);
    } catch (e) {
        console.log(`Could not read file ${f}`);
        return undefined;
    }
    try {
        json = JSON.parse(data);
    } catch (e) {
        console.log(`Could not parse json from file ${f}`);
        return undefined;
    }
    return json
}

main();
