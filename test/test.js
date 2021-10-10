const ghostWriter = require('../index');
const fs = require('fs');
const path = require("path");

var filePath = "test/examples/code.lua"
var text = fs.readFileSync(filePath, 'utf8');
var fileName = path.basename(filePath);

var markdown = ghostWriter.toMarkdown(fileName, text, ghostWriter.luaTemplate);

console.log("# Ghost Writer Markdown\n", markdown);