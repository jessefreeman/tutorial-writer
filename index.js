const tutorialWriter = require('./lib/tutorial-writer');

tutorialWriter.luaTemplate = require('./templates/lua-template').template;
tutorialWriter.charpTemplate = require('./templates/csharp-template').template;

module.exports = tutorialWriter;