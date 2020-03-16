ace.define('ace/mode/json_mustache_highlight_rules', ["require", "exports", "module", "ace/lib/oop", "ace/mode/text_highlight_rules", "ace/mode/json", "ace/mode/json_highlight_rules"], function(require, exports, module) {
  "use strict";

  console.log(`onDefine : json_mustache_highlight_rules`);

  var oop = require("ace/lib/oop");
  var TextHighlightRules = require("ace/mode/text_highlight_rules").TextHighlightRules;

  var JsonMustacheHighlightRules = function() {
    this.$rules = {
      "start" : [
        {
          token: "string.regex",
          regex: "{{",
          next: "mustache"
        }, {
          token : "string", // single line
          regex : '"',
          next  : "string"
        }, {
          token : "constant.numeric", // hex
          regex : "0[xX][0-9a-fA-F]+\\b"
        }, {
          token : "constant.numeric", // float
          regex : "[+-]?\\d+(?:(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)?\\b"
        }, {
          token : "constant.language.boolean",
          regex : "(?:true|false)\\b"
        }, {
          token : "text", // single quoted strings are not allowed
          regex : "['](?:(?:\\\\.)|(?:[^'\\\\]))*?[']"
        }, {
          token : "comment", // comments are not allowed, but who cares?
          regex : "\\/\\/.*$"
        }, {
          token : "comment.start", // comments are not allowed, but who cares?
          regex : "\\/\\*",
          next  : "comment"
        }, {
          token : "paren.lparen",
          regex : "[[({]"
        }, {
          token : "paren.rparen",
          regex : "[\\])}]"
        }, {
          token : "text",
          regex : "\\s+"
        }
      ],
      "mustache": [
        {
          token : "string.regex",
          regex : "}}",
          next  : "start"
        },
        {
          defaultToken: "string.regex"
        }
      ],
      "mustache-string": [
        {
          token : "string.regex",
          regex : "}}",
          next  : "string"
        },
        {
          defaultToken: "string.regex"
        }
      ],
      "string" : [
        {
          token : "string.regex",
          regex : "{{",
          next  : "mustache-string"
        }, {
          token : "constant.language.escape",
          regex : /\\(?:x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|["\\\/bfnrt])/
        }, {
          token : "string",
          regex : '"|$',
          next  : "start"
        }, {
          defaultToken : "string"
        }
      ],
      "comment" : [
        {
          token : "comment.end", // comments are not allowed, but who cares?
          regex : "\\*\\/",
          next  : "start"
        }, {
          defaultToken: "comment"
        }
      ]
    };
  };

  oop.inherits(JsonMustacheHighlightRules, TextHighlightRules);
  exports.JsonMustacheHighlightRules = JsonMustacheHighlightRules;
});

ace.define('ace/mode/json_mustache', function(require, exports, module) {

  console.log(`onDefine : json_mustache`);
  
  var oop = require("ace/lib/oop");
  var TextMode = require("ace/mode/text").Mode;
  var JsonMustacheHighlightRules = require("ace/mode/json_mustache_highlight_rules").JsonMustacheHighlightRules;

  var Mode = function() {
    this.HighlightRules = JsonMustacheHighlightRules;
  };
  oop.inherits(Mode, TextMode);

  (function() {
    // Extra logic goes here. (see below)
  }).call(Mode.prototype);

  exports.Mode = Mode;
});
