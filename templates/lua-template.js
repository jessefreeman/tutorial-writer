const steps = require('./step-templates');
const patterns = require('./special-patterns');

const luaTemplate = {
    language: 'Lua',
    syntax: 'lua',
    regexPatterns: {
        Variable: /(local)+\s+(\w+)/,
        Function: /\b(function)\b/,
        Condition: /\b(if)\b/,
        Loop: /\b(for)\b/,
        Else: /\b(else)\b/,
        BlockEnd: /\b(end)\b/
    },
    codeBlockTokens: {
        CommentBlockStart: "--[[",
        CommentBlockEnd: "]]--",
        Comment: "--",
        BlockEnd: "end",
        DefaultScope: "global"
    },
    stepTemplates: {
        Step: steps.templates.Step,
        CreateFile: steps.templates.CreateFile,
        Callout: steps.templates.Callout,
        CodeBlock: steps.templates.CodeBlock,
        Code: steps.templates.Code,
        Condition: steps.templates.Condition,
        Loop: steps.templates.Loop,
        Else: steps.templates.Else,
        FinalCode: steps.templates.FinalCode,
        Function: "Create a new `{0}` called `{1}()`:",
        Variable: "Create a new `{0}` variable called `{1}`{2}:",
        Variables: "Add the following `local` variables:",
    },
    specialPatterns: 
    {
        CamelCaseNames: patterns.specialPatterns.CamelCaseNames,
        SplitNameExtension: patterns.specialPatterns.SplitNameExtension,
        WhiteSpace: patterns.specialPatterns.WhiteSpace,
        Scope: /(local\s)/,
    },
};

exports.template = luaTemplate;