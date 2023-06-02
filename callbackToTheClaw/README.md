# Validate Config Repo

This action is implemented as a [javascript action](https://docs.github.com/en/actions/creating-actions/creating-a-javascript-actio://docs.github.com/en/actions/creating-actions/creating-a-javascript-action).

The dev flow is different for this repo: we build the "binary" locally using `ncc` and check the built "binary" into
source control. Ncc is similar to webpack in that it merges code and dependencies into a single javascript file. This is
the workflow suggested by the [Github Actions documentation](https://docs.github.com/en/actions/creating-actions/creating-a-javascript-action#commit-tag-and-push-your-action-to-github).


# Development
- Make your changes
- Run `npm run build` to compile deps into the finished "binary" at `./dist/index.js`
- Git add your changes to `./src` and `./dist`
- Git push

For easier development, install [entr](https://github.com/eradman/entr/) and run `find . | entr npm run build` which
will automatically rebuild the binary any time a file is changed.

## Testing

### Against a locally running instance of svcs-theclaw
Create a file `test.env` with the contents:
```
THECLAW_ENVIRONMENT=local
INPUT_COLLECTIVE=wutang
INPUT_STATUS=failure
BASE_URL=http://localhost:8080
GITHUB_SHA=<a_commit_hash_you_want_to_send_to_the_claw>
```

Then run `export $(cat test.env | xargs)` to set environment variables.
Then run `node ./dist/index.js` to run the app.

(or all in one line: `env $(< ./test.env xargs) node ./dist/index.js`)

### Against svcs-theclaw-dev
To test against dev, you'll need to fill out a few secrets:
```
THECLAW_ENVIRONMENT=dev
INPUT_COLLECTIVE=wutang
INPUT_STATUS=failure
INPUT_CLIENT_ID=<add_the_dev_secret_here!>
INPUT_CLIENT_SECRET=<add_the_dev_secret_here!>
GITHUB_SHA=<a_commit_hash_you_want_to_send_to_the_claw>
```

### Testing Notes
Some notes on how this works:
- This is roughly how Github Actions passes inputs in. When the code runs `core.getInput("foo_bar")`, it looks for an
  env-var named `INPUT_FOO_BAR`.
- Env-vars not prefixed with "INPUT_" (e.g. BASE_URL, GITHUB_SHA, etc) are slightly different since they are only used for
  testing: if the env-var exists it is used, otherwise a default defined in the code is used.
- `THECLAW_ENVIRONMENT` describes which environment of The Claw you are calling against. There are three possible
  values: `local`, `dev`, and `prod` (which is the default if unspecified). In `dev` or `prod` mode, `INPUT_CLIENT_ID`
  and `INPUT_CLIENT_SECRET` are required. In `local` mode, `BASE_URL` is required but client creds are not.
- `INPUT_STATUS` can be `success` or `failure`
- For local (or dev environment) testing, the GITHUB_SHA for a module can be obtained in the browser's network dev
  tools: Check the "GET /releases/" call (after promoting), view the response, and filter for "latestCommitSHA". It
  should pare your results back to just the latestCommitSHA fields. Find the one for the module you are interested in.
