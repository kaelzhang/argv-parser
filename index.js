'use strict';

module.exports = clean;
clean.Clean = Clean;

var minimist = require('minimist');
var cleaner = require('./lib/cleaner');


function clean(options) {
  return new Clean(options);
}


// @param {schema} schema
// @param {Object} options
// - offset: {Number} the offset of the argv at which we should begin to parse
// - schema: {Object}
// - shorthands: {Object}
// - context: {Object} the context of the helper functions
// - parallel: {boolean=false} whether checker should check the properties in parallel, default to false
// - limit: {boolean=false} limit to the schema
function Clean(options) {
  this.options = options = options || {};

  if (typeof options.offset !== 'number') {
    options.offset = clean.PARSE_ARGV_OFFSET;
  }

  this._types = {};

  this._reverseShorthands();
}


// @returns {object|undefined}
Clean.prototype._get_cleaner = function(key, context) {
  var rule = this.options.schema && this.options.schema[key];
  if (!rule) {
    return;
  }

  return new Cleaner(rule, context, key);
};


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


// Parse and clean
Clean.prototype.parse = function(argv, callback) {
  var data = this.argv(argv);
  this.clean(data, callback);
};


// Gets the argv object without sanitizing
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
};


Clean.prototype.registerType = function(type, schema) {
  this._types[type] = schema;
};


// ```pseudo javascript
// If options.boolean: ['flag']
// minimist('--abc') -> 
// {
//   flag: false,
//   abc: true
// }
// Then, we can not figure out whether user define `flag` explicitly or just use the default value
// So, clean the result of minimist.
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

  // 'cwd' -> 'c'
  var shorthand = this._reversed[key];
  return argv.some(function (arg) {
    if (REGEX_IS_SHORT.test(arg)) {
      // '-c' -> 'c'
      arg = arg.slice(1);
      // 'c' -> match
      // 'cf' -> combined shorthands, match
      return shorthand && ~arg.indexOf(shorthand);
    }

    // '--no-cwd'
    var negative_key = '--no-' + key;

    // '--cwd'
    return arg === '--' + key
      || arg === negative_key;
  });
};
