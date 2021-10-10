# Ghost Writer

This is a simple utility for converting Lua and C# scripts into tutorials. I created this to help me automatically generate tutorials for [Pixel Vision 8](https://github.com/pixelvision8/pixelvision8).

Please not this is designed for a very specific use case and may not work correctly on any Lua or C# file. You need to specially formate you code in a way that Ghost Writer can inspect.

Here is an example Lua script:

```lua
--[[
  A multi line 
  
  comment call out box
]]--

-- This is a local variable
local total = 0

-- Here is a function
function Init()

  -- This is a call out example

  -- Here is a loop
  for i = 1, total do

      -- Here is a condition in a for loop
      if (Tile(pos.x, pos.y).SpriteId > -1) then
          
          -- Here is a block of code in a for loop if condition
          table.insert(tileIDs, index)
          
          --Testing multiple close blocks (Should be ignored)
      end
    end
end
```

In order to use Ghost Writer you'll want to install it from NPM and create a simple script that watches for any changes in Lua or C# files.

```javascript
const ghostWriter = require('../index');
const fs = require('fs');
const path = require("path");

var filePath = "test/examples/code.lua"
var text = fs.readFileSync(filePath, 'utf8');
var fileName = path.basename(filePath);

var markdown = ghostWriter.toMarkdown(fileName, text, ghostWriter.luaTemplate);

console.log("# Ghost Writer Markdown\n", markdown);
```

Run the script and it will generate a string with the contents of the `code.lua` markdown in it.

Here is a preview of how the example Lua script would look after Ghost Writer converts it:

### Step 1

Create a new file called `code.lua.{1}` in your project folder.

> A multi line
>
> comment call out box
>
### Step 2

Create a new `local` variable called `total` inside the `script`:

```Lua
01 local total = 0
```

This is a local variable

### Step 3

Create a new `function` called `Init()`:

```Lua
02 function Init()
03 
04 end
```

Here is a function

> This is a call out example
>
### Step 4

Create the following Loop:

```Lua
03   for i = 1, total do
04   
05   end
```

Here is a loop

### Step 5

Add the following condition to the `script`:

```Lua
04       if (Tile(pos.x, pos.y).SpriteId > -1) then
05       
06       end
```

Here is a condition in a for loop

### Step 6

Add the following code to the  condition :

```Lua
05           table.insert(tileIDs, index)
```

Here is a block of code in a for loop if condition

### Final Code

When you are done, you should have the following code in the `code.lua` file:

```Lua
01 local total = 0
02 function Init()
03   for i = 1, total do
04       if (Tile(pos.x, pos.y).SpriteId > -1) then
05           table.insert(tileIDs, index)
06       end
07   end
08 end
```

You can feed Ghost Writer different templates for other languages. Right now Lua is the most complete template. You can find these in the `templates` folder. Here is what the default `Lua Template` looks like:

```javascript
{
  language: 'Lua',
  syntax: 'lua',
  regexPatterns: {
    Variable: /(local)+\s+(\w+)/,
    Function: /(function|\s)+\s+(\w+) *\([^\)]*\)/,
    Condition: /if/,
    Loop: /for/,
    Else: /else/,
    BlockEnd: /end/
  },
  codeBlockTokens: {
    CommentBlockStart: "--[[",
    CommentBlockEnd: "]]--",
    Comment: "--",
    BlockEnd: "end",
    DefaultScope: "global"
  },
  stepTemplates: {
    Step: "### Step {0}\n\r{1}\n\r{2}\n\r",
    CreateFile: "Create a new file called `{0}.{1}` in your project folder.\n\r",
    Callout: "> {0}\n>\r",
    Code: "Add the following code to the {0}:",
    Condition: "Add the following condition to the {0}:",
    Loop: "Create the following Loop:",
    Else: "Add an else to the {0}:",
    CodeBlock: "\n\r\r```{0}\r{1}```",
    FinalCode: "### Final Code\n\rWhen you are done, you should have the following code in the `{0}` file:\n\r\r```{1}\r{2}```",
    Function: "Create a new `{0}` called `{1}()`:",
    Variable: "Create a new `{0}` variable called `{1}`{2}:",
    Variables: "Add the following `local` variables:",
  },
  specialPatterns: 
  {
    CamelCaseNames: /([a-zA-Za-z0-9]*\(\).|\w[a-z]+[A-Z0-9][a-z0-9]+[A-Za-z0-9]*)/gm,
    SplitNameExtension: /(^.*?)\.(\w+)$/,
    WhiteSpace: /\S/,
    Scope: /(local\s)/,
  },
}
```