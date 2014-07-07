'use strict';

module.exports = clean;
clean.Clean = Clean;

var minimist = require('minimist');
var checker = require('checker');
var util = checker.util;

var node_path = require('path');
var node_url = require('url');
var node_stream = require('stream');


function clean(options) {
  return new Clean(options);
}


// @param {schema} schema
// @param {Object} options
// - offset: {Number} the offset of the argv at which we should begin to parse
// - schema: {Object}
// - shorthands: {Object}
// checker options:
// - context: {Object} the context of the helper functions
// - default_message: {string}
// - parallel: {boolean=false} whether checker should check the properties in parallel, default to false
// - limit: {boolean=false} limit to the schema
// - check_all: {boolean=false} by default, checker will exit immediately when the first error is encountered.
// - input_mode: {boolean=false}
function Clean(options) {
  this.options = options = options || {};

  if (typeof options.offset !== 'number') {
    options.offset = clean.PARSE_ARGV_OFFSET;
  }

  this._types = {};

  this._parseSchema();
  this._reverseShorthands();
  this.checker = checker(this._schema, this.options);
}


Clean.prototype._reverseShorthands = function() {
  var reversed = this._reversed = {};
  if (this.options.shorthands) {
    util.map(this.options.shorthands, function (arg, shorthand) {
      reversed[arg] = shorthand;
    });
  }
};


//  0       1           2          3
// ['node', __filename, <command>, [options] ]
clean.PARSE_ARGV_OFFSET = 2;


// parse and clean
Clean.prototype.parse = function(argv, callback) {
  var data = this.argv(argv);
  this.clean(data, callback);
};


Clean.prototype.argv = function(argv) {
  var minimist_options = this._parseArgvOptions();
  var sliced = argv.slice(this.options.offset);
  var data = minimist(sliced, minimist_options);

  // #13
  // We should clean the data, that we should stay the data clean and untouched.
  // If user have not define the argument in argv,
  // `data` object should not contain the argument key.
  this._cleanMinimist(data, sliced);

  return data;
};


Clean.prototype._parseArgvOptions = function() {
  var o = {
    string: [],
    boolean: [],
    alias: this.options.shorthands
  };
  util.map(this._schema, function (rule, name) {
    if (rule.type === Boolean) {
      o.boolean.push(name);
    }
  });
  return o;
};


Clean.prototype.clean = function(object, callback) {
  this.checker.check(object, callback);
};


Clean.prototype.registerType = function(type, schema) {
  this._types[type] = schema;
};


Clean.prototype._cleanMinimist = function(data, argv) {
  Object.keys(data).forEach(function (key) {
    // We should not delete `'_'`
    if (key === '_') {
      return;
    }

    if (!this._argvExists(key, argv)) {
      delete data[key];
    }
  }.bind(this));
};


var REGEX_IS_SHORT = /^-[a-z0-9]+/i;
Clean.prototype._argvExists = function(key, argv) {
  var shorthand = this._reversed[key];
  return argv.some(function (arg) {
    if (REGEX_IS_SHORT.test(arg)) {
      arg = arg.slice(1);
      return shorthand && ~arg.indexOf(shorthand);
    }

    var negative_key = '--no-' + key;

    return arg === '--' + key
      || arg === negative_key;
  });
};


// schema
// <key>: {

//     // schema for argv >>>>>>>>>>>>>>>>
//     short: 'c',
//     // '-c' is equivalent to '--cwd <default-short-value>' 
//     short_pattern: ['--cwd', '<default-short-value>'],

//     // schema for santitizing >>>>>>>>>>>>>>>>>>
//     default: process.cwd(),
//     type: node_path,
//     validator: {function()
//     setter: {function()}
//     required: {boolean}
// }
Clean.prototype._parseSchema = function() {
  var schema = checker.parseSchema(this.options.schema);
  util.map(schema, function(rule, name) {
    if (rule.required) {
      rule.validator.unshift(required_validator);
    }

    var type = rule.type;
    var type_def = this._getTypeDef(type);

    if (type_def.validator) {
      rule.validator.unshift(type_def.validator);
    }

    if (type_def.setter) {
      rule.setter.unshift(type_def.setter);
    }

  }, this);

  this._schema = schema;
};


Clean.prototype._getTypeDef = function(type) {
  var rule = this._types[type] || TYPES[type];

  // must be an object, or abandon it
  if (Object(rule) === rule) {
    return rule;
  }

  var key;
  var def;

  for (key in TYPES) {
    def = TYPES[key];

    if (type === def.type) {
      return def;
    }
  }

  return {};
};


function required_validator(value, is_default) {
  var done = this.async();

  if (is_default) {
    done({
      code: 'EREQUIRED',
      data: {
        value: value
      }
    });
  } else {
    done(null);
  }
};


var TYPES = {
  string: {
    type: String,
    setter: function(value, is_default) {
      if (is_default && value === undefined) {
        return '';
      }

      // If is normal string, strip html tags to prevent XSS attack
      return String(value).replace(/<[^>]+>/g, '');
    }
  },

  number: {
    type: Number,
    validator: function(value) {
      return !isNaN(value);
    },
    setter: function(value) {
      return Number(value);
    }
  },

  boolean: {
    type: Boolean,
    setter: function(value) {
      if (value instanceof Boolean) {
        return value.valueOf();

      } else if (typeof value === 'string') {
        if (!isNaN(value)) {
          return !!(+value);

        } else if (value === 'null' || value === 'false') {
          return false;

        } else {
          return true;
        }

      } else {
        return !!value;
      }
    }
  },

  date: {
    type: Date,
    setter: function(value) {
      var done = this.async();

      var date = Date.parse(value);

      if (isNaN(date)) {
        done({
          code: 'ETYPE',
          message: '"' + value + '" is not a valid date.',
          data: {
            value: value
          }
        });
      } else {
        done(null, new Date(value));
      }
    }
  },

  html: {
    type: 'html',
    setter: function(value) {
      return String(value);
    }
  },

  url: {
    type: node_url,
    setter: function(value, is_default) {
      var done = this.async();

      if (is_default && value === undefined) {
        return done(null, value);
      }

      // if the parameter is not string, an error occurs
      var url = node_url.parse(String(value));

      if (!url.host) {
        done({
          code: 'ETYPE',
          message: '"' + value + '" is not a valid url.',
          data: {
            value: value,
            expect: 'url'
          }
        });

      } else {
        done(null, url.href);
      }
    }
  },

  stream: {
    type: node_stream,
    validator: function(value) {
      return value instanceof node_stream;
    }
  },

  path: {
    type: node_path,
    validator: function(value, is_default) {
      var done = this.async();
      if (!is_default && typeof value !== 'string') {
        return done({
          code: 'ETYPE',
          message: '`' + value + '` is not a valid path.',
          data: {
            value: value,
            expect: 'path'
          }
        });
      } else {
        done(null);
      }
    },

    setter: function(value, is_default) {
      // we should not convert `undefined` to some path like `/Users/xxx/undefined`
      if (is_default && value === undefined) {
        return value;
      } else {
        return node_path.resolve(String(value));
      }
    }
  }
};

clean.TYPES = TYPES;