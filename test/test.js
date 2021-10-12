const tutorialWriter = require('../index');
const fs = require('fs');
const path = require("path");

var filePath = "./examples/code.lua"
var fileName = path.basename(filePath);

var text = fs.readFileSync(filePath, 'utf8');

var markdown = tutorialWriter.toMarkdown(fileName, text, tutorialWriter.luaTemplate);

console.log("# Tutorial Writer Markdown\n", markdown);