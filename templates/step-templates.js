const stepsTemplates = {
    Step: "### Step {0}\n\r{1}\n\r{2}\n\r",
    CreateFile: "Create a new file called `{0}.{1}` in your project folder.\n\r",
    Callout: "> {0}\n>\r",
    Code: "Add the following code to the {0}:",
    Condition: "Add the following condition to the {0}:",
    Loop: "Create the following Loop:",
    Else: "Add an else to the {0}:",
    CodeBlock: "\n\r\r```{0}\r{1}```",
    FinalCode: "### Final Code\n\rWhen you are done, you should have the following code in the `{0}` file:\n\r\r```{1}\r{2}```",
};

exports.templates = stepsTemplates;