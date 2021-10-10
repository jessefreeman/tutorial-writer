const ghostWriter = require('./lib/ghost-writer');

ghostWriter.luaTemplate = require('./templates/lua-template').template;

module.exports = ghostWriter;