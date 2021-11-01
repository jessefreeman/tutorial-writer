// imports an dictionary of code blocks the parser uses to verify each code block.
const codeBlockType = require("../templates/code-block-types").types;

// Some helper vars for new line and hard returns when converting to markdown
let newLine = "\n";
let hardReturn = "\n\r";

// First, checks if it isn't implemented yet. This functions like C#'s string.format method. It allows you to replace tokens in a string. It looks for {0}, {1}, {2}, etc.
if (!String.prototype.format) {
    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != "undefined" ? args[number] : match;
        });
    };
}

// Another helper function to help pad strings to the left which is used when formatting line numbers
if (!String.prototype.padLeft) {
    String.prototype.padLeft = function (n, str) {
        return Array(n - String(this).length + 1).join(str || "0") + this;
    };
}

// This object helps convert code into markdown by providing a type, pulling out comments, and breaking up eac line of code so they can be iterated over. A code block is any collection of lines separate by a blank line. Each one's raw text is fed into this object while the markdown parser runs through the code.
function CodeBlock(template) {

    // A path to a template (./templates/lua-template.js) which provides all of the regex patterns needed to parse the code.
    this.template = template;
    this.name = "";

    // Stores each line of code
    this.lines = [];

    // Tracks indent levels while parsing
    this.indentLevel = 0;

    // This is used to calculate the total lines
    this.lineOffset = 0;

    // Returns the first line of the code block. This is used to determine the type of code block.
    this.getFirstLine = function () {
        for (var i = 0; i < this.lines.length; i++) {
            var tmpLine = this.lines[i];
            if (!tmpLine.startsWith(this.template.codeBlockTokens.Comment)) {
                return i;
            }
        }
        return -1;
    };

    // This returns the total number of lines inside of the code block.
    this.getTotalCodeLines = function () {
        var lineNum = 0;
        var total = this.lines.length;
        for (var i = 0; i < total; i++) {
            var line = this.lines[i];
            if (!line.startsWith(this.template.codeBlockTokens.Comment)) {
                lineNum++;
            }
        }
        return lineNum + this.lineOffset;
    };

    // This is used to add a new line to the end of the code block.
    this.addLine = function (text) {
        this.lines.push(text.trim());
    };

    // This adds an empty line to the end of the code block and adjusts the line offset.
    this.addEmptyLine = function () {
        this.lines.push("");
        this.lineOffset -= 1;
    };

    // This is used to add a new line to "close" the code block and adjusts the line offset. This is usually called when inside of a function, loop, or any other detected code block that requires a closing line.
    this.closeCodeBlockLines = function () {
        
        // We need to make sure all methods end with the correct closing
        if (this.lines.slice(-1)[0].trim() != this.template.codeBlockTokens.BlockEnd) {
            this.lines.push("");
            this.lines.push(this.template.codeBlockTokens.BlockEnd);
            this.lineOffset = -2;
        }

    };

    // This is ued to pull the comment at the top of the code block and return it as a string. This is what the markdown parser uses to create the step text for each code block.
    this.getCommentText = function () {
        var comments = [];
        var commentType = "";
        var total = this.lines.length;
        var commentText = "";

        // This loops through the code block and pulls out the comments. It's still hard coded to look for C# XML style comments or comments found in the template via Regex.
        for (var i = 0; i < total; i++) {
            var line = this.lines[i]; // need to trim start
            
            // This is used for C# XML style comments
            if (line.substring(0, 3) == this.template.codeBlockTokens.XMLComment) {
                comments.push(line.trim().length <= 3 ? hardReturn : line.substring(3).trim());
                commentType = this.template.codeBlockTokens.XMLComment;
            }
            
            // This is used for normal comments based on the template, i.e. "--" in Lua.
            else if (line.substring(0, 2) == this.template.codeBlockTokens.Comment) 
            {

                // We have to trim each comment line so we don't accidentals capture the indents.
                comments.push(line.trim().length <= 2 ? hardReturn : line.substring(2).trim()); 

                // We need to set the comment type so the markdown parser knows how to handle it
                commentType = this.template.codeBlockTokens.Comment;

            }
        }

        // Joins the comments together as a single string with a space between each line.
        commentText = comments.join(" ");
        
        // Custom logic for C# XML comments since the contents of the XML node and children need to be read.
        if (commentType == this.template.codeBlockTokens.XMLComment) {
            parser = new DOMParser();
            xmlDoc = parser.parseFromString("<root>" + commentText + "</root>", "text/xml");
            commentText = xmlDoc.getElementsByTagName("summary")[0].textContent;
        }

        // returns the final comment for the code block
        return commentText.trim();
    };
}

// This is the main object that parses code via the convertScriptToMarkdown function.
function TutorialWriter(template) {
    
    // The language template which is passed in.
    this.template = template;

    // This keeps track of every line of code each step produces so we can display the all the code in the correct order at the end.
    this.finalCode = [];

    // This function accepts a file name and the text with all the code in it. It then parses the code and returns the markdown.
    this.convertScriptToMarkdown = function (name, text) {
        
        // Split each line of text
        var lines = text.split(newLine);
        
        // We'll keep each code block in this array
        var codeBlocks = [];
        
        // Current code block we are parsing
        var codeBlock = null;
        
        // Total lines we will parse
        var total = lines.length;
        
        // Tracks if we are still inside of a comment block which is used when comment blocks have empty lines inside of them.
        var inCommentBlock = false;

        // The total number of lines we have parsed
        this.totalLines = 0;

        // Loop through each line and try to find code blocks
        for (var i = 0; i < total; i++) {

            // The current line
            var originalLine = lines[i];

            // Test to see if we reached an empty line which marks the end of a code block
            if (this.template.specialPatterns.WhiteSpace.test(originalLine)) {
               
                // If we don't have a current codeblock, create a new one
                if (codeBlock == null) {
                    
                    // Create the new CodeBlock
                    codeBlock = new CodeBlock(this.template);
                    
                    // Capture the whitespace so we can figure out the indent level
                    var whiteSpace = originalLine.search(this.template.specialPatterns.WhiteSpace);
                    
                    // Track the current indent level for the CodeBlock
                    codeBlock.indentLevel = whiteSpace == null ? 0 : whiteSpace;
                
                }
                
                // Calculate the current line number for the code block
                currentLine = originalLine.trim();
                
                // Check to see the the current line starts with so we can determine if it's a comment or not. In Lua this would be "--[["
                if (currentLine.startsWith(this.template.codeBlockTokens.CommentBlockStart)) {
                    
                    // Clear the current line so we don't capture the comment start block
                    currentLine = "";

                    // We are now inside of a comment block
                    inCommentBlock = true;
                } 

                // Looks for the end of the comment block i.e. in Lua it's "]]--"
                else if (currentLine.startsWith(this.template.codeBlockTokens.CommentBlockEnd)) {
                    
                    // Clear the current line so we don't capture the comment end block
                    currentLine = "";

                    // We are no longer inside of a comment block
                    inCommentBlock = false;
                }

                // Checks to see if we are still inside of a code block
                if (inCommentBlock) {
                    
                    // capture the current line
                    currentLine = this.template.codeBlockTokens.Comment + " " + currentLine;
                }

                // Test to see if the line is not empty
                if (currentLine != "") {

                    // Add the line to the current CodeBlock
                    codeBlock.addLine(currentLine);

                }

                // Increment the line count
                this.totalLines += codeBlock.lines.length;

            }

            // We have hit a new empty line so we can close off the code block
            else
            {
                // Time to add the code block to the array, make sure it is not set to null
                if (codeBlock != null) {

                    // Get the lines and if it is great than 0 we have a valid CodeBlock
                    if (codeBlock.lines.length > 0) {
                        
                        // Push the CodeBlock into the array
                        codeBlocks.push(codeBlock);
                        
                        // Clear the current CodeBlock so a new one will be created during the next loop iteration
                        codeBlock = null;
                    }
                }
            }
        }

        // At this point, all of the code blocks have been created and now it's time to convert them into markdown.
        
        // Create a variable to store the markdown
        var markdown = "";

        // Keep track if we are inside of a code block
        var inComment = true;

        // Loop through the first comment and turn that into the introduction
        for (let i = 0; i < codeBlocks.length; i++) {
            
            // Get the current code block
            let block = codeBlocks.shift();

            // Assign the block a type
            var type = this.getType(block);

            // If we are inside of the comment, keep adding them to the markdown. This is the introduction of the file when we find a large comment block a the top of the file.
            if (inComment == true && type == codeBlockType.Comment) {
                markdown += this.toTutorialMarkdown(block) + hardReturn;
            } else {

                // Remove the first comment block from the list so we don't convert it again.
                codeBlocks.unshift(block);
                break;
            }
        }

        // At this point we have any introduction text

        // The first step is always to make the file the code will go into
        markdown += this.template.stepTemplates.Step.format(1, this.template.stepTemplates.CreateFile.format(name), "");

        // Now we need to parse all of the code block so we pass them into the convert function and add the string it returns to the markdown.
        markdown += this.convertCodeBlocksToMarkdown(codeBlocks, 0);

        // Now we need to build the final code
        var finalScript = newLine;

        // We need need to pad the line numbers so we convert the total lines to a string and count the number of chars.
        var padding = this.totalLines.toString().length;

        // Loop through the final code and add the line numbers and the code to the final script
        for (let i = 0; i < this.finalCode.length; i++) {
            
            // Calculate the line number and pad it plus the line of code
            finalScript += (i + 1).toString().padLeft(padding) + " " + this.finalCode[i] + newLine;

        }

        // Add the final script to the markdown
        markdown += this.template.stepTemplates.FinalCode.format(name, this.template.language, finalScript);

        // Return the markdown
        return markdown;
    };

    // This function accepts an array of code blocks and then converts the code blocks into markdown and returns the markdown.
    this.convertCodeBlocksToMarkdown = function (codeBlocks, firstBlockID) {

        // We start with an empty string
        var markdown = "";

        // We need to keep track of previous blocks so we can determine if we are inside of a code block or not.
        var blockHistory = [];

        // Keep track of the number of steps we have created
        var stepCounter = 1;

        // Keep track of the current line number
        var lineNumber = 1;

        // Get the total blocks of code
        var total = codeBlocks.length;

        // Loop through the code blocks
        for (var i = firstBlockID; i < total; i++) {

            // Get the code block we are working with
            var block = codeBlocks[i];

            // Calculate the type of the code block
            var type = this.getType(block);

            // At this point we have a type for the current code block and need to run through all of the options to determine what to do with it.

            // Check to see if we are at the end of a nested block such as a function or loop. In lua this would be "end"
            if (type == codeBlockType.BlockEnd) {

                // If the block history is greater than 0 we remove the last code block from the history since we are no longer inside of it.
                if (blockHistory.length > 0) {
                    blockHistory.pop();
                }

                // Increment the line number
                lineNumber++;

            } 
            
            // At this point we have accounted for exiting a nested code block so we need actually convert the code block to markdown
            else {

                // If the type is a comment, use the step template's  
                if (type == codeBlockType.Comment) {

                    // We get the template's string which has a token in it and call format() while passing in the markdown we get back from converting the code block.
                    markdown += this.template.stepTemplates.Callout.format(this.toTutorialMarkdown(block));

                } 
                // If the type is not a comment, we need to get add the code step
                else {

                    // We use this to track where the current block of code is located in the file. By default, we assume all code at the root is just being added to the "script" file.
                    var insideText = "`script`";

                    // Look to see if we are inside of a code block
                    if (blockHistory.length > 0) {

                        // TODO I think this part is not working correctly. It should be able to determine the type of the previous block so when it adds the step it knows that it's being added inside of a parent code block like a function or loop.

                        // We don't know what block we are inside so we need to clear the variable
                        insideText = " ";

                        // We look back at the last block to determine what type of code block we are inside of
                        var lastBlock = blockHistory[blockHistory.length - 1].split(":");

                        // Add the last block and current block as the inside text
                        insideText += lastBlock[1] + " " + lastBlock[0];
                    }

                    // Cover the entire code block into markdown and supply the inside text and the current line number
                    var code = this.toTutorialMarkdown(block, insideText, lineNumber);

                    // Pull out the comment
                    var comment = block.getCommentText();
                    
                    // Increment the line number based on the total number of lines in the code block we just parsed
                    lineNumber += block.getTotalCodeLines();

                    // TODO this should be expanded to include other types of nested code blocks like switches, classes, etc. based on the language.

                    // Determine if we need to add the current block to the history. We test for methods/functions, loops and conditions.
                    if (type == codeBlockType.Method || type == codeBlockType.Function) {
                        blockHistory.push(type + ":" + block.name);
                    } else if (type == codeBlockType.Condition) {
                        blockHistory.push("" + ":" + block.name);
                    } else if (type == codeBlockType.Else) {
                        blockHistory[blockHistory.total - 1] = block.name + ":" + type;
                    }

                    // Increase the step counter now that we have converted the code block to markdown
                    stepCounter++;

                    // Add the step to the markdown
                    markdown += this.template.stepTemplates.Step.format(stepCounter, code, comment);

                }
            }
        }
        return markdown;
    };

    // This is used to determine the type of the code block.
    this.getType = function (codeBlock) {

        // By default, all blocks are considered "code" which is the generic way to handle the step.
        var type = codeBlockType.Code;

        // We need to read the first line of the code block to determine what type of code block it is.
        var firstLine = codeBlock.getFirstLine();

        // Calculate the start id
        var startID = Math.max(0, firstLine);

        // Get the first line of the code block
        var line = codeBlock.lines[startID];

        // Check to see if the first line is a comment
        if (line.substring(0, 2) == this.template.codeBlockTokens.Comment) {
            
            // Loop through all the lines and make them into a single comment
            var noComment = false;
            var total = codeBlock.lines.length;
            for (var i = 1; i < total; i++) {
                var tmpLine = codeBlock.lines[i];
                if (tmpLine.substring(0, 2) != this.template.codeBlockTokens.Comment) {
                    noComment = true;
                    break;
                }
            }
            // Return the type as comment
            if (noComment == false) return codeBlockType.Comment;
        }

        // This comment was converted into a markdown callout so we want to make it's type a callout
        else if (line.substring(0, 1) == ">") {
            return codeBlockType.Callout;
        }

        // Read all of the regex patterns from the templates
        var patterns = this.template.regexPatterns;

        // Loop through all of the patterns to see if we can determine what type of code block it is
        for (const key in patterns) {
            
            // If the regex test passes we return that as the type.
            if (patterns[key].test(line)) {
                type = key;
                break;
            }

        }

        // See if there are multiple fields
        if (type == codeBlockType.Field) {
            if (codeBlock.lines.length > startID) {
                if (patterns.Field.test(codeBlock.lines[startID + 1])) {
                    type = codeBlockType.Fields;
                }
            }
        }
        // See if there are multiple variables
        else if (type == codeBlockType.Variable) {
            if (codeBlock.lines.length > startID) {
                if (patterns.Variable.test(codeBlock.lines[startID + 1])) {
                    type = codeBlockType.Variables;
                }
            }
        }
        // Test to see if there is an else after the block end
        else if (type == codeBlockType.BlockEnd) {
            if (codeBlock.lines.length > 1) {
                if (patterns.Else.test(codeBlock.lines[1].trim())) type = codeBlockType.Else;
            }
        }

        return type;
    };

    this.toTutorialMarkdown = function (codeBlock, insideBlockText, lineNumber) {

        // Start with an empty string
        var text = "";

        // Calculate the padding for the line numbers
        var padding = this.totalLines.toString().length;

        // Inside block add a location to where code gets added. If no value exists, make it an empty string.
        if (insideBlockText == null) {
            insideBlockText = "";
        }

        // Get the code block's type
        var type = this.getType(codeBlock);

        // If the type is a comment, get the comment from the code block and return it.
        if (type == codeBlockType.Comment) {
            return codeBlock.getCommentText();
        }

        // Get the step template based on the type
        var template = this.template.stepTemplates[type];

        // Calculate the first ID
        var startID = codeBlock.getFirstLine();

        // At this point we need to do some special formatting for different code templates so we look at the type and perform the formatting.

        // TODO each language should have some kind of formatting option here. While most languages support some common types like fields, variables, functions, methods, loops, etc. other languages will have unique type and should be handled here since they will be ignored if the language doesn't support them.

        // This is used for C# to format the code block as a namepsace
        if (type == codeBlockType.Namespace) {
            var namespace = codeBlock.lines[startID].split(" ")[1];
            text += template.format(namespace);

            // We always call closeCodeBlockLines() when we are done with the code block that has an open and close like functions, loops, conditions, classes, etc.
            codeBlock.closeCodeBlockLines();
        
        } 
        // This is used for languages that support classes
        else if (type == codeBlockType.Class) {
            var split = codeBlock.lines[startID].split(this.template.regexPatterns.Class);
            var classSplit = split[split.length - 1].split(":");
            var extendsSplit = classSplit[1].split(",");
            var totalExtended = extendsSplit.length;
            var extendsText = "";
            
            if (totalExtended > 0) {
                extendsText = this.template.stepTemplates.Extends.format(extendsSplit[0].trim());
            }

            // TODO this is not really working and should be fixed to make sure it understands how the language handles multiple inheritance and extending of another class.

            // This is used for languages that support interfaces or extending other classes
            if (totalExtended > 1) {
                for (var i = 1; i < totalExtended; i++) {
                    if (i == totalExtended - 1) {
                        extendsText += " and";
                    } else {
                        extendsText += ",";
                    }

                    extendsText += " `" + extendsSplit[i] + "`";
                }
            }

            // Make sure we close this code block for the step text
            codeBlock.closeCodeBlockLines();

            // Add the name of the class to the codeblock
            codeBlock.name = "`" + classSplit[0] + "`";

            // Format the template text that was defined at the top of the loop
            text += template.format(split[0].trim(), classSplit[0].trim(), extendsText);
        } 
        // This is used for languages that support methods or functions
        else if (type == codeBlockType.Method || type == codeBlockType.Function) {

            // We split the function by "(" so we can parse the name and parameters
            var split = codeBlock.lines[startID].split("(")[0].split(" ");
            
            // The method name is always the last item in the split
            var methodName = split[split.length - 1];

            // We add the template to the text variable and format it
            text += template.format(split[0], methodName, split[split.length - 2], insideBlockText);

            // We have to close this since we are in a function
            codeBlock.closeCodeBlockLines();

            // Save out the name
            codeBlock.name = "`" + methodName + "()`";
        
        } 

        // TODO this should be expanded to understand globals in Lua, JS, etc as well as properties in C#.

        // We use this for fields or variables
        else if (type == codeBlockType.Field || type == codeBlockType.Variable) {
            // Get the line
            var line = codeBlock.lines[startID].trim();
            
            // Split on equals sign
            var fieldValues = line.split("=")[0].trim();
            var valueSplit = fieldValues.split(" ");
            var totalValues = valueSplit.length;
            var fieldName = valueSplit[totalValues - 1];
            
            // Find the scope of the field
            var fieldScope = fieldValues.match(this.template.specialPatterns.Scope)[0].trim();

            // By default, all field scopes should be set to global
            if (fieldScope == null) {
                fieldScope = "global";
            }

            // We need to state that this is inside of some other code block, the default being the script itself it the code is at the root.
            var insideCodeText = " inside the " + insideBlockText;

            // Get the field template and populate with the values we found
            text += template.format(fieldScope, fieldName, insideCodeText);
            
            // Save the field name
            codeBlock.name = fieldName;
        } 
        
        // If there are multiple fields or variables, we treat them as a group
        else if (type == codeBlockType.Fields || type == codeBlockType.Variables) {
            text += template.format(insideBlockText);
            codeBlock.name = "fields";
        } 
        
        // We use this to determine if we are in a condition
        else if (type == codeBlockType.Condition) {
            text += template.format(insideBlockText);

            // Close the code block since we are in a condition
            codeBlock.closeCodeBlockLines();
            codeBlock.name = "condition";
        } 
        
        // TODO there should be a test for C# and JS like Switches

        // We use this to determine if we are in a loop
        else if (type == codeBlockType.Loop) {
            text += template.format(insideBlockText);
            codeBlock.closeCodeBlockLines();
            codeBlock.name = "loop";
        }
        
        // We use this if we are in an else statement inside of a condition
        else if (type == codeBlockType.Else) {
            text += template.format(insideBlockText);
            codeBlock.name = "else condition";
        } 
        
        // We use this at the end of a code block. Since we don't want to add extra closing statements, i.e "end" in lua, we just ignore this and exit out of the function
        else if (type == codeBlockType.BlockEnd) {

            // This only works because we assume that all code blocks with an end block are added previously so we can ignore the end if it's on its own line or paired up with several other end statements.
            return;
        } 
        
        // This is used for any generic code block we can't identify
        else {
            text += template.format(insideBlockText);
        }

        // At this point we are ready to convert the lines into code we can then convert into markdown
        
        // We use this to store the code lines as a string
        var codeLines = "";

        // TODO Nested indentions are broken see issue #1 (https://github.com/jessefreeman/tutorial-writer/issues/1)

        // We use this to track the indention level
        var indent = codeBlock.indentLevel;

        // Determine how many lines we need to loop through
        var total = codeBlock.lines.length;
        for (var i = 0; i < total; i++) {

            // Get the current line
            var line = codeBlock.lines[i];

            // Check to see that this line does not contain a comment (At this point we ignore any additional comments)
            if (line.substring(0, 2) != this.template.codeBlockTokens.Comment) {
                
                // Check the line number and add save it 
                if (lineNumber != -1) {
                    var lineNumberString = lineNumber.toString().padLeft(padding) + " ";
                    lineNumber++;
                }

                // Get the line of code
                var lineCode = codeBlock.lines[i];

                // Capture the indent level
                var indent = codeBlock.indentLevel;
                
                // Pad for the indent
                for (let j = 0; j < indent; j++) {
                    lineCode = " " + lineCode;
                }

                // Add the line number and line of code plus a new line for a single line of code
                codeLines += lineNumberString + lineCode + newLine;

                // Convert the new line number string back to a number (we use this so we know where to put it in the final code array)
                var lineNum = parseInt(lineNumberString) - 1;

                // If we are at the end of a code block we need to add this inside of the empty line of the code block
                if (lineCode == this.template.codeBlockTokens.BlockEnd) {
                    this.finalCode.splice(lineNum, 1, lineCode);
                } 
                
                // If there is no line number or it's an empty string we just insert it as is
                else if (this.finalCode[lineNum] != null && this.finalCode[lineNum].trim() == "") {
                    this.finalCode.splice(lineNum, 1, lineCode);
                } 

                // Continue to add the line of code to the end of the final code array
                else {
                    this.finalCode.splice(lineNum, 0, lineCode);
                }
            }
        }

        // Format the code lines and return the markdown.
        text += this.template.stepTemplates.CodeBlock.format(this.template.language, codeLines);
        return text;
    };
}

exports.toMarkdown = function (filename, text, template) {
    // Create a new instance of the Tutorial Writer
    var writer = new TutorialWriter(template);
    // Convert the code to markdown
    return writer.convertScriptToMarkdown(filename, text);
};
