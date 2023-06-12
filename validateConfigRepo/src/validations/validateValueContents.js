const fs = require('fs');
const Parser = require('tree-sitter');
const {Query} = require('tree-sitter');
const Yaml = require('tree-sitter-yaml');

const Issue = require('../Issue');

/**
 * This tree-sitter query describes the tree structure of a single variable
 * definition in one of our config files - from the root of the document, down
 * to the variable value, capturing several nodes along the way for later processing.
 *
 * It's like a semantic regex that describes the structure of the yaml document.
 *
 * Nodes in the tree are represented by the structure: (NODE_TYPE (CHILD_NODES)).
 * (_) is a wildcard node, and @tag_name will capture a node for reference
 * later, much like a regex capture.
 *
 * For more info see https://tree-sitter.github.io/tree-sitter/using-parsers#pattern-matching-with-queries
 *
 * NOTE: tree-sitter queries don't actually support comments, but I'm using -- as
 * a comment char for my own sanity.
 */
const treesitterQueryString = `
 -- Here starts the full document and the root object.
 -- A block_mapping represents a yaml object in the "block" style. It contains many mapping pairs. A block_node
 -- is a sort of container afaict. It wraps around any structure or value that uses the "block" yaml style.
 (document (block_node (block_mapping

      -- A block_mapping_pair represents a key/value pair within an object! This one matches a config section since it is
      -- the first level under the document root.
      (block_mapping_pair
          key: (_) @sectionName
          -- The value is another object...
          value: (block_node (block_mapping

              -- This key/value pair represents a variable definition. The key is the name of the var, and the
              -- value is another object with "description" and "value" fields.
			  (block_mapping_pair
				key: (_) @variableName
				value: (block_node (block_mapping
                    -- NOTE: Though every variable has it, we don't need to define anything for
                    -- the "description" key/value pair since we aren't doing any validation on it.

                    -- Like in regex, * indicates this is optional. Here we capture any comments that
                    -- may or may not precede a variable value.
					(comment)* @comments

                    -- This is the variable value definition keypair.
                    (block_mapping_pair
                      key: (_) @valueDefKey

                      -- This is a conditional to make sure we are looking at the "value" key.
                      -- It doesn't have to go here, but if I put it at the end of the query, things get weird.
                      (#match? @valueDefKey "value")

                      -- This is the value of the "value" key (that's confusing...); capture it so we can inspect it later.
                      -- Note: this capture is a little rough - it captures the quotes around the value too. This could be
                      -- narrowed down in the future.
                      value: (_) @valueDefValue
                    ) @variableValueDefinition


                -- Close it out. These captures aren't used in validation, but were handy for debugging.
                ))
              ) @variableDef
          ))
      ) @sectionDef
 )))
`

/**
 * Validate that none of the variable values in a config contain forbiddenStrings.
 *
 * This is mostly to make sure we don't accidentally commit dev/eval values to prod,
 * but is parameterized so we could run similar checks against dev or eval configs if needed.
 *
 * A "forbidden string" is allowed in a value if there is a preceding comment
 * with an annotation @allow-string:val where 'val' is the forbidden string.
 *
 * @param {Config} config - A Config object
 * @param {Array<string>} forbiddenStrings A list of strings that shouldn't be found in this config file (unless annotated).
 * @returns {Array<Issue>} A list of Issues
 */
function validateValueContents(config, forbiddenStrings) {

    forbiddenStrings = forbiddenStrings.map(s => s.toLowerCase());

    const parser = new Parser();
    parser.setLanguage(Yaml);

    const fileData = fs.readFileSync(config.file);
    const tree = parser.parse(fileData.toString());

    // // Uncomment to see the entire treesitter tree
    // console.log(`tree.rootNode.toString(): `, tree.rootNode.toString());

    // Set up and run the query
    const q = new Query(Yaml, treesitterQueryString.replace(/--.*/g, ''));
    const matches = q.matches(tree.rootNode)

    // Find any issues
    let issues = matches.map(match => {
            let sectionName = match.captures.find(c => c.name == "sectionName").node;
            let variableName = match.captures.find(c => c.name == "variableName").node;
            let variableValue = match.captures.find(c => c.name == "valueDefValue").node;
            // This one is a list of nodes
            let commentNodes = match.captures.filter(c => c.name == "comments")
                .map(c => c.node);


            let offendingSubstrings = findOffendingSubstrings(variableValue.text, forbiddenStrings);
            let permittedSubstrings = findPermittedSubstrings(commentNodes);
            // This is equivalent to: offendingSubstrings - permittedSubstrings
            let offenses = offendingSubstrings.filter(x => !permittedSubstrings.includes(x));

            // console.log(`variableValue.text: `, variableValue.text)  // TODO DELETE ME
            // console.log(`offendingSubstrings: `, offendingSubstrings)  // TODO DELETE ME
            // console.log(`permittedSubstrings: `, permittedSubstrings)  // TODO DELETE ME
            // console.log(`offenses: `, offenses)  // TODO DELETE ME
            // console.log()  // TODO DELETE ME

            return {
                sectionName,
                variableName,
                variableValue,
                offenses,
            }
        })
        // Filter out variables that had no issues.
        .filter(i => i.offenses.length != 0)
        // Convert to a list of Issue objects, since a single var could have > 1 issue.
        .flatMap(i => {
            let line = i.variableValue.startPosition.row + 1;
            return i.offenses.map(offendingString => {
                let error = `Line [${line}]: found unallowed string [${offendingString}] in ` +
                `variable value [${i.sectionName.text}.${i.variableName.text}]. This string is unallowed in this environment. Update variable ` +
                `value or add a comment annotation (e.g. '# @allow-string:${offendingString}') to the preceding line.`;
                return new Issue(config.file, error);
            });
        });

    // console.log(`issues: `, issues);

    return issues;

}

////////////////////////////////////////////////////////////////////////
//                               UTILS                                //
////////////////////////////////////////////////////////////////////////

function findOffendingSubstrings(s, forbiddenStrings) {
    let lowercaseS = s.toLowerCase();
    return forbiddenStrings.filter(badString => lowercaseS.includes(badString));
}

function findPermittedSubstrings(commentNodes) {
    return commentNodes.flatMap(node => {
        let commentString = node.text;
        let matches = commentString.matchAll(/@allow-string:(?<allowed>[^ ]*)/g);
        let substrings = Array.from(matches, m => m.groups?.allowed);
        return substrings;
    });
}

module.exports.validateValueContents = validateValueContents;
