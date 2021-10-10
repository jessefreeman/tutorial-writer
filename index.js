const tutorialWriter = require('./lib/tutorial-writer');

tutorialWriter.luaTemplate = require('./templates/lua-template').template;

module.exports = tutorialWriter;