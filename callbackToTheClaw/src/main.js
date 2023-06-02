'use strict';

const core = require('@actions/core'); // github actions
const github = require('@actions/github'); // github actions
const ServicesClient = require('@uw-it-sis/lib-lambda/lib/ServicesClient');
const BasicHttpClient = require('@uw-it-sis/lib-lambda/lib/BasicHttpClient');

async function main() {
    // Call to theclaw-dev if environment is set to "dev". Use theclaw prod if environment is unset.
    const environment = process.env.THECLAW_ENVIRONMENT ?? 'prod';
    const collective = core.getInput("collective", {required: true});
    const status = core.getInput("status", {required: true});
    const commithash = github.context.sha;
    const envExtension = environment == "dev" ? "-dev" : "";

    // Create a client
    let client;
    let baseUrl;
    switch (environment) {
        case 'local':
            baseUrl = process.env.BASE_URL;
            client = new BasicHttpClient();

            break;

        default:
            baseUrl = `https://api.theclaw${envExtension}.sis.uw.edu`;
            client = new ServicesClient( {
                idpUrl:       `https://auth.api.theclaw${envExtension}.sis.uw.edu/oauth2/token`,
                clientId:     core.getInput("client_id", {required: true}),
                clientSecret: core.getInput("client_secret", {required: true}),
            });
    }

    // Send the callback to The Claw
    const url = `${baseUrl}/theclaw/${collective}/builds/${commithash}/${status}`
    try {
        await client.doPut(url, {}); // No body to send, all of the info is in the URL
    } catch (e) {
        console.log(`Error during build callback to The Claw: `, e);
    }
}


main();
