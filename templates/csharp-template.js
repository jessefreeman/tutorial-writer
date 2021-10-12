const steps = require('./step-templates');
const patterns = require('./special-patterns');

const csharpTemplate = {
    language: 'Lua',
    syntax: 'lua',
    regexPatterns: {
        Field: /(public|protected|private|static|\s)( +[\w\<\>\[\]]+\s+)(\w+)/,
        Method: /[\w\<\>\[\]]+\s+(\w+) *\([^\)]*\)/,
        SplitNameExtension: /(^.*?)\.(\w+)$/,
        EmptyLine: /^\s*$/,
        Include: /using/,
        Namespace: /namespace/,
        Class: /class/,
        Interface: /interface/,
        Condition: /if/,
        Loop: /for/,
        Else: /else/,
        BlockEnd: /}/,
        CamelCaseNames: /([a-zA-Za-z0-9]*\(\).|\w[a-z]+[A-Z0-9][a-z0-9]+[A-Za-z0-9]*)/gm,
        WhiteSpace: /^\s+/,
        MethodPreface: /^([public|private|protected].*?\b)(\(.*?\))/,
        MethodSplit: /^(.*?)(\(.*?\))/,
        Property: /(public|protected|private|static).*?(get|set)/
    },
    codeBlockTokens: {
        CommentBlockStart: "/*",
        CommentBlockEnd: "*/",
        Comment: "//",
        XMLComment: "///",
        BlockEnd: "}",
        DefaultScope: "private",
        Region: "#"
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
        Class: "Create a new `{0} class` called `{1}`{2}:",
        Namespace: "Well be using the following namespace `{0}` for our classes.",
        ClassSummary: "### Summary\n\r{0}\n\r",
        Extends: " that extends `{0}`",
        Method: "Create a new `{0}` method called `{1}` that returns a type `{2}`:",
        Field: "Create a new `{0}` {1} called `{2}` typed to `{3}`:",
        Fields: "Add the following fields near the top of the {0}:",
        Property: "Create a new `{0}` property called `{1}` with a type `{2}` inside of the{3}:",
        Properties: "Add the following properties near the top of the {0}:"
    },
    specialPatterns: 
    {
        CamelCaseNames: patterns.specialPatterns.CamelCaseNames,
        SplitNameExtension: patterns.specialPatterns.SplitNameExtension,
        WhiteSpace: patterns.specialPatterns.WhiteSpace,
        Scope: /(public|private|protected|static).*/,
    },
};

exports.template = csharpTemplate;