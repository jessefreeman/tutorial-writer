const codeBlockType = require("../templates/code-blocks").types;
  
let newLine = "\n";
let hardReturn = "\n\r";

// First, checks if it isn't implemented yet.
if (!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined' ?
                args[number] :
                match;
        });
    };
}
if (!String.prototype.padLeft) {
    String.prototype.padLeft = function(n, str) {
        return Array(n - String(this).length + 1).join(str || '0') + this;
    }
}

function CodeBlock(template) {
    this.template = template;;
    this.name = "";
    this.lines = [];
    this.indentLevel = 0;
    this.lineOffset = 0;
    this.getFirstLine = function() {
        for (var i = 0; i < this.lines.length; i++) {
            var tmpLine = this.lines[i];
            if (!tmpLine.startsWith(this.template.codeBlockTokens.Comment)) {
                return i;
            }
        }
        return -1;
    };
    this.getTotalCodeLines = function() {
        var lineNum = 0;
        var total = this.lines.length;
        for (var i = 0; i < total; i++) {
            var line = this.lines[i];
            if (!line.startsWith(this.template.codeBlockTokens.Comment)) {
                lineNum++;
            }
        }
        return lineNum + this.lineOffset;
    }
    this.addLine = function(text) {
        this.lines.push(text.trim());
    }
    this.addEmptyLine = function() {
        this.lines.push("")
        this.lineOffset -= 1
    }
    this.closeCodeBlockLines = function() {
        // We need to make sure all methods end with the correct closing
        if (this.lines.slice(-1)[0].trim() != this.template.codeBlockTokens.BlockEnd) {
            this.lines.push("");
            this.lines.push(this.template.codeBlockTokens.BlockEnd);
            this.lineOffset = -2;
        }
    }
    this.getCommentText = function() {
        var comments = [];
        var commentType = "";
        var total = this.lines.length;
        var commentText = "";
        for (var i = 0; i < total; i++) {
            var line = this.lines[i]; // need to trim start
            if (line.substring(0, 3) == this.template.codeBlockTokens.XMLComment) {
                comments.push(line.trim().length <= 3 ? hardReturn : line.substring(3).trim());
                commentType = this.template.codeBlockTokens.XMLComment;
            } else if (line.substring(0, 2) == this.template.codeBlockTokens.Comment) {
                comments.push(line.trim().length <= 2 ? hardReturn : line.substring(2).trim());
                commentType = this.template.codeBlockTokens.Comment;
            }
        }
        commentText = comments.join(" ");
        if (commentType == this.template.codeBlockTokens.XMLComment) {
            parser = new DOMParser();
            xmlDoc = parser.parseFromString("<root>" + commentText + "</root>", "text/xml");
            commentText = xmlDoc.getElementsByTagName("summary")[0].textContent;
        }
        return commentText.trim();
    }
}
// Global Enum for code block types
function TutorialWriter(template) {
    this.template = template;;
    this.finalCode = [];
    this.convertScriptToMarkdown = function(name, text) {
        // this.ext = ext;
        // Split each line of text
        var lines = text.split(newLine);
        // We'll keep each code block in this array
        var codeBlocks = [];
        // Current code block we are parsing
        var codeBlock = null;
        // Total lines we will parse
        var total = lines.length;
        var inCommentBlock = false
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
                currentLine = originalLine.trim(); //.substring(Math.min(currentLine.length, codeBlock.indentLevel));
                if (currentLine.startsWith(this.template.codeBlockTokens.CommentBlockStart)) {
                    currentLine = ""
                    inCommentBlock = true
                } else if (currentLine.startsWith(this.template.codeBlockTokens.CommentBlockEnd)) {
                    currentLine = ""
                    inCommentBlock = false
                }
                if (inCommentBlock) {
                    // TODO need to make sure we preserve formatting and linebreaks
                    currentLine = this.template.codeBlockTokens.Comment + " " + currentLine;
                }
                // Add the line to the current CodeBlock
                if (currentLine != "") {
                    codeBlock.addLine(currentLine);
                }
                this.totalLines += codeBlock.lines.length
            } else {
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
        // console.log("lines", this.totalLines);
        // The first step is always to make the file the code will go into
        var markdown = this.template.stepTemplates.Step.format(1, this.template.stepTemplates.CreateFile.format(name), "");
        // TODO need to figure out how to add a license to the code
        markdown += this.convertCodeBlocksToMarkdown(codeBlocks, 0);
        var finalScript = newLine;
        var padding = this.totalLines.toString().length;
        for (let i = 0; i < this.finalCode.length; i++) {
            finalScript += (i + 1).toString().padLeft(padding) + " " + this.finalCode[i] + newLine;
        }
        markdown += this.template.stepTemplates.FinalCode.format(name, this.template.language, finalScript);
        // Convert the rest of the CodeBlocks into markdown, we skip the first code block since it's usually the license
        return markdown;
    }
    this.convertCodeBlocksToMarkdown = function(codeBlocks, firstBlockID) {
        var markdown = "";
        var startID = 0;
        var blockHistory = [];
        var stepCounter = 1;
        var lineNumber = 1;
        var total = codeBlocks.length;
        for (var i = firstBlockID; i < total; i++) {
            var block = codeBlocks[i]
            var type = this.getType(block);
            if (type == codeBlockType.BlockEnd) {
                if (blockHistory.length > 0) {
                    blockHistory.pop();
                }
                lineNumber++;
            } else {
                if (type == codeBlockType.Comment) {
                    markdown += this.template.stepTemplates.Callout.format(this.toTutorialMarkdown(block));
                } else {
                    var insideText = "`script`";
                    if (blockHistory.length > 0) {
                        insideText = " ";
                        var lastBlock = blockHistory[blockHistory.length - 1].split(":");
                        insideText += lastBlock[1] + " " + lastBlock[0];
                    }
                    var code = this.toTutorialMarkdown(block, insideText, lineNumber);
                    var comment = block.getCommentText(); //.replace(regexPatterns[this.ext].CamelCaseNames, "`$1`");
                    lineNumber += block.getTotalCodeLines();
                    if (type == codeBlockType.Method) {
                        blockHistory.push(type + ":" + block.name);
                    } else if (type == codeBlockType.Condition) {
                        blockHistory.push("" + ":" + block.name);
                    } else if (type == codeBlockType.Else) {
                        blockHistory[blockHistory.total - 1] = block.name + ":" + type;
                    }
                    stepCounter++;
                    markdown += this.template.stepTemplates.Step.format(stepCounter, code, comment);
                }
            }
        }
        return markdown;
    }
    this.getType = function(codeBlock) {
        var type = codeBlockType.Code;
        var firstLine = codeBlock.getFirstLine();
        var startID = Math.max(0, firstLine);
        var line = codeBlock.lines[startID];
        if (line.substring(0, 2) == this.template.codeBlockTokens.Comment) {
            var noComment = false;
            var total = codeBlock.lines.length;
            for (var i = 1; i < total; i++) {
                var tmpLine = codeBlock.lines[i];
                if (tmpLine.substring(0, 2) != this.template.codeBlockTokens.Comment) {
                    noComment = true;
                    break;
                }
            }
            if (noComment == false)
                return codeBlockType.Comment;
        } else if (line.substring(0, 1) == '>') {
            return codeBlockType.Callout;
        }

        var patterns = this.template.regexPatterns;

        
        // var newType = codeBlockType.Code;
        for (const key in patterns) {

            // console.log("Testing", key);
            if (patterns[key].test(line)) {
                type = key;
                break;
            }
        }

        // See if there are multiple fields
        if(type == codeBlockType.Field) 
        {
            if (codeBlock.lines.length > startID) {
            if (patterns.Field.test(codeBlock.lines[startID + 1])) {
                type = codeBlockType.Fields;
            }
            }
        }
        // See if there are multiple variables
        else if(type == codeBlockType.Variable) 
        {
            if (codeBlock.lines.length > startID) {
                if (patterns.Variable.test(codeBlock.lines[startID + 1])) {
                    type = codeBlockType.Variables;
                }
            }
        }
        // Test to see if there is an else after the block end 
        else if (type == codeBlockType.BlockEnd) {
            if (codeBlock.lines.length > 1) {
            if (patterns.Else.test(codeBlock.lines[1].trim()))
                type = codeBlockType.Else;
            } 
        }

        // console.log("type", type, newType, line);
        return type;
    };
    
    this.toTutorialMarkdown = function(codeBlock, insideBlockText, lineNumber) {
        
        var text = "";
        
        var padding = (this.totalLines).toString().length;
        
        // Inside block add a location to where code gets added. If no value exists, make it an empty string.
        if (insideBlockText == null) {
            insideBlockText = "";
        }
        var type = this.getType(codeBlock);
        if (type == codeBlockType.Comment) {
            return codeBlock.getCommentText(); //.replace(regexPatterns[this.ext].CamelCaseNames, "`$1`");
        }

        var template = this.template.stepTemplates[type];

        var startID = codeBlock.getFirstLine();

        if (type == codeBlockType.Namespace) {

            var namespace = codeBlock.lines[startID].split(" ")[1];
            text += template.format(namespace);

            codeBlock.closeCodeBlockLines();

        } else if (type == codeBlockType.Class) {
            var split = codeBlock.lines[startID].split(this.template.regexPatterns.Class);
            var classSplit = split[split.length - 1].split(":");
            var extendsSplit = classSplit[1].split(',');
            var totalExtended = extendsSplit.length;
            var extendsText = "";
            if (totalExtended > 0) {
                extendsText = this.template.stepTemplates.Extends.format(extendsSplit[0].trim());
            }

            // TODO need to test that this works
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

            codeBlock.name = "`" + classSplit[0] + "`";

            text += template.format(split[0].trim(), classSplit[0].trim(), extendsText);
        }
        else if (type == codeBlockType.Method || type == codeBlockType.Function) {
            var split = codeBlock.lines[startID].split('(')[0].split(" ");
            var methodName = split[split.length - 1];
            text += template.format(split[0], methodName, split[split.length - 2], insideBlockText);
            codeBlock.closeCodeBlockLines();
            // Save out the name
            codeBlock.name = "`" + methodName + "()`";
        } else if (type == codeBlockType.Field || type == codeBlockType.Variable) {
            // Get the line
            var line = codeBlock.lines[startID].trim();
            // Find the total chars in the string
            // Split on equils sign
            var fieldValues = line.split('=')[0].trim();
            var valueSplit = fieldValues.split(' ');
            var totalValues = valueSplit.length;
            var fieldName = valueSplit[totalValues - 1];
            // var fieldType = valueSplit[totalValues-2];
            // Find the scope of the field
            var fieldScope = fieldValues.match(this.template.specialPatterns.Scope)[0].trim();
            // By default, all field scopes should be set to global
            if (fieldScope == null) {
                fieldScope = "global";
            }
            var insideCodeText = " inside the " + insideBlockText
            // Get the field template and populate with the values we found
            text += template.format(fieldScope, fieldName, insideCodeText);
            // Save the field name
            codeBlock.name = fieldName;
        } else if (type == codeBlockType.Fields || type == codeBlockType.Variables) {
            text += template.format(insideBlockText);
            codeBlock.name = "fields";
        } else if (type == codeBlockType.Condition) {
            text += template.format(insideBlockText);
            codeBlock.closeCodeBlockLines();
            codeBlock.name = "condition";
        } else if (type == codeBlockType.Loop) {
            text += template.format(insideBlockText);
            codeBlock.closeCodeBlockLines();
            codeBlock.name = "loop";
        } else if (type == codeBlockType.Else) {
            text += template.format(insideBlockText);
            codeBlock.name = "else condition";
        } else if (type == codeBlockType.BlockEnd) {
            return;
        } else if (type == codeBlockType.Code) {
            text += template.format(insideBlockText);
        }
        // Add return before next block of text
        //text;
        var codeLines = "";
        var indent = codeBlock.indentLevel;

        var total = codeBlock.lines.length;
        for (var i = 0; i < total; i++) {
            var line = codeBlock.lines[i];
            if (line.substring(0, 2) != this.template.codeBlockTokens.Comment) {
                if (lineNumber != -1) {
                    var lineNumberString = lineNumber.toString().padLeft(padding) + " ";
                    lineNumber++;
                }
                var lineCode = codeBlock.lines[i];
                var indent = codeBlock.indentLevel;
                
                for (let j = 0; j < (indent); j++) {
                    lineCode = " " + lineCode;
                }
                codeLines += lineNumberString + lineCode + newLine;
                var lineNum = parseInt(lineNumberString) - 1;
                if (lineCode == this.template.codeBlockTokens.BlockEnd) {
                    this.finalCode.splice(lineNum, 1, lineCode);
                } else if (this.finalCode[lineNum] != null && this.finalCode[lineNum].trim() == "") {
                    this.finalCode.splice(lineNum, 1, lineCode);
                } else {
                    this.finalCode.splice(lineNum, 0, lineCode);
                }
            }
        }
        // Close code tag and add a return
        text += this.template.stepTemplates.CodeBlock.format(this.template.language, codeLines);
        return text;
    }
}

  exports.toMarkdown = function(filename, text, template) {
    // Create a new instance of the Tutorial Writer
    var writer = new TutorialWriter(template);
    // Convert the code to markdown
    return writer.convertScriptToMarkdown(filename, text);
  };