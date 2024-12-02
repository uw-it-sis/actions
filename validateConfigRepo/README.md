# Validate Config Repo

This action is implemented as a [javascript action](https://docs.github.com/en/actions/creating-actions/creating-a-javascript-actio://docs.github.com/en/actions/creating-actions/creating-a-javascript-action).

The dev flow is different for this repo: we build the "binary" locally using `ncc` and check the built "binary" into
source control. Ncc is similar to webpack in that it merges code and dependencies into a single javascript file. This is
the workflow suggested by the [Github Actions documentation](https://docs.github.com/en/actions/creating-actions/creating-a-javascript-action#commit-tag-and-push-your-action-to-github).

Note: Github requires actions to use node 20, so you'll need to run `nvm use 20` when building this project.

# Development
- Make your changes
- Run `npm run build` to compile deps into the finished "binary" at `./dist/index.js`
- Git add your changes to `./src` and `./dist`
- Git push

For easier development, install [entr](https://github.com/eradman/entr/) and run `find . | entr npm run build` which
will automatically rebuild the binary any time a file is changed.

## Testing
You can run the code locally against a config repo. Pass the directory path as the first argument, e.g.:
```
node ./src/main.js ~/src/uw/config-planning
```
