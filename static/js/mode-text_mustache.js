ace.define('ace/mode/text_mustache_highlight_rules', ["require", "exports", "module", "ace/lib/oop", "ace/mode/text_highlight_rules"], function(require, exports, module) {
  "use strict";

  console.log(`onDefine : text_mustache_highlight_rules`);

  var oop = require("ace/lib/oop");
  var TextHighlightRules = require("ace/mode/text_highlight_rules").TextHighlightRules;

  var TextMustacheHighlightRules = function() {
    this.$rules = {
      "start" : [
        {
          token: "string.regex",
          regex: "{{",
          next: "mustache"
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
      ]
    };
  };

  oop.inherits(TextMustacheHighlightRules, TextHighlightRules);
  exports.TextMustacheHighlightRules = TextMustacheHighlightRules;
});

ace.define('ace/mode/text_mustache', function(require, exports, module) {

  console.log(`onDefine : text_mustache`);
  
  var oop = require("ace/lib/oop");
  var TextMode = require("ace/mode/text").Mode;
  var TextMustacheHighlightRules = require("ace/mode/text_mustache_highlight_rules").TextMustacheHighlightRules;

  var Mode = function() {
    this.HighlightRules = TextMustacheHighlightRules;
  };
  oop.inherits(Mode, TextMode);

  (function() {
    // Extra logic goes here. (see below)
  }).call(Mode.prototype);

  exports.Mode = Mode;
});