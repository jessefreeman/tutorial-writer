const steps = require('./step-templates');
const patterns = require('./special-patterns');

// A working example of a Lua template.
const luaTemplate = {

    // Define the language name.
    language: 'Lua',

    // define the syntax which matches up to the file extension
    syntax: 'lua',

    // Pattens to help parse Lua specific types
    regexPatterns: {
        Variable: /(local)+\s+(\w+)/,
        Function: /\b(function)\b/,
        Condition: /\b(if)\b/,
        Loop: /\b(for)\b/,
        Else: /\b(else)\b/,
        BlockEnd: /\b(end)\b/
    },

    // tokens used to determine comments, comment blocks, endings for code blocks and scope
    codeBlockTokens: {
        CommentBlockStart: "--[[",
        CommentBlockEnd: "]]--",
        Comment: "--",
        BlockEnd: "end",
        DefaultScope: "global"
    },

    // All the steps for the steps used by the language. Some steps are always shared across all language templates which you can see in the step-templates.js file.
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
        // This are unique steps for lua
        Function: "Create a new `{0}` called `{1}()`:",
        Variable: "Create a new `{0}` variable called `{1}`{2}:",
        Variables: "Add the following `local` variables:",
    },
    // These are special regex patterns the template needs. Some of these are shared across all languages which you can see in the special-patterns.js file.
    specialPatterns: 
    {
        CamelCaseNames: patterns.specialPatterns.CamelCaseNames,
        SplitNameExtension: patterns.specialPatterns.SplitNameExtension,
        WhiteSpace: patterns.specialPatterns.WhiteSpace,
        // This is a unique pattern to determine Lua variable scope
        Scope: /(local\s)/,
    },
};

exports.template = luaTemplate;