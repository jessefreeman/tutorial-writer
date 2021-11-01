// These are supported code block types used by the parser so we don't rely on "magic strings" and have something to compare to.
const codeBlockType = 
{
    Code: "Code",
    Variable: "Variable",
    Variables: "Variables",
    Function: "Function",
    Comment: "Comment",
    Condition: "Condition",
    Loop: "Loop",
    Else: "Else",
    BlockEnd: "BlockEnd",
    Include: "Include",
    Namespace: "Namespace",
    Class: "Class",
    Constructor: "Constructor",
    Field: "Field",
    Fields: "Fields",
    Property: "Property",
    Properties: "Properties",
    Method: "Method",
    Interface: "Interface",
    XMLComment: "XMLComment",
    Switch: "Switch",
    StartRegion: "StartRegion",
    EndRegion: "EndRegion"
}

exports.types = codeBlockType;