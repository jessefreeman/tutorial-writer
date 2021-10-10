const tutorialWriter = require('../index');
const fs = require('fs');
const path = require("path");

var filePath = "test/examples/code.lua"
var text = fs.readFileSync(filePath, 'utf8');
var fileName = path.basename(filePath);

var markdown = tutorialWriter.toMarkdown(fileName, text, tutorialWriter.luaTemplate);

console.log("# Tutorial Writer Markdown\n", markdown);