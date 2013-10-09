'use strict';

var parser      = module.exports = {};

// var nopt        = require('nopt');
var checker     = require('checker');
var node_path   = require('path');
var node_url    = require('url');
var node_stream = require('stream');


//  0       1           2          3
// ['node', __filename, <command>, [options] ]
parser.PARSE_ARGV_OFFSET = 2;


// Part of the built-in enum types from nopt 

// Copyright 2009, 2010, 2011 Isaac Z. Schlueter.
// All rights reserved.

// Permission is hereby granted, free of charge, to any person
// obtaining a copy of this software and associated documentation
// files (the "Software"), to deal in the Software without
// restriction, including without limitation the rights to use,
// copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following
// conditions:

// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
// OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
// HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
// WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
// OTHER DEALINGS IN THE SOFTWARE.
var TYPES = {
    string: {
        type: String,
        setter: function (value) {
            // If is normal string, strip html tags to prevent XSS attack
            return String(value).replace(/<[^>]+>/g, '');
        }
    },

    number: {
        type: Number,
        validator: function (value) {
            return !isNaN(value);
        },
        setter: function (value) {
            return Number(value);
        }
    },

    boolean: {
        type: Boolean,
        setter: function (value) {
            if ( value instanceof Boolean ) {
                return value.valueOf();

            } else if ( typeof value === 'string' ) {
                if ( !isNaN(value) ) {
                    return !!(+value);

                } else if ( value === 'null' || value === 'false' ) {
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
        setter: function (value) {
            var done = this.async();

            var date = Date.parse(value);

            if (isNaN(date)){
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
        setter: function (value) {
            return String(value);
        }
    },

    url: {
        type: node_url,
        setter: function (value) {
            var done = this.async();

            // if the parameter is not string, an error occurs
            var url = node_url.parse(String(value));

            if ( !url.host ) {
                done({
                    code: 'ETYPE',
                    message: '"' + value + '" is not a valid url.',
                    data: {
                        value: value
                    }
                });
            } else {
                done(null, url.href);
            }
        }
    },

    stream: {
        type: node_stream,
        validator: function (value) {
            return value instanceof node_stream;
        }
    },

    path: {
        type: node_path,
        setter: function (value, is_default) {

            // we should not convert `undefined` to some path like `/Users/xxx/undefined`
            if ( is_default && value === undefined ) {
                return value;
            } else {
                return node_path.resolve(value);
            }
        }
    }
};

// cwd: {
//     short: 'c',
//     // '-c' is equivalent to '--cwd <default-short-value>' 
//     short_pattern: ['--cwd', '<default-short-value>'],

//     // @type {mixed|function()} default value or generator
//     // - {function()}
//     value: process.cwd(),
//     type: node_path,
//     required: true
// }

// @param {Object} options
// - rules: {Object}
// - offset: {Object} the offset argv-parser start to parse
parser.parse = function(argv, options) {
    var parsed_rules = parser._parse_rules(options.rules);
    var parsed = parser._parse_argv(argv, parsed_rules, options.offset || parser.PARSE_ARGV_OFFSET);

    return parser._(parsed, parsed_rules.defaults);
};


// Clean the given data object according to the rules
// @param {Object} options
// - rules: {Object}
// - types: {Object} type definitions
parser.clean = function(data, options) {
    var parsed_rules = parser._parse_rules(options.rules);
    nopt.clean(data, parsed_rules.types, options.type_defs || parser.TYPES);

    return parser._(data, parsed_rules.defaults);
};


function mix (receiver, supplier, override){
    var key;

    if(arguments.length === 2){
        override = true;
    }

    for(key in supplier){
        if(override || !(key in receiver)){
            receiver[key] = supplier[key]
        }
    }

    return receiver;
}


parser._parse_rules = function(rules) {
    var opt_types = {};
    var short_hands = {};
    var default_values = {};

    var opts = Object.keys(rules);

    opts.forEach(function(key) {
        var option = rules[key];

        opt_types[key] = option.type;

        if(option.short){
            short_hands[option.short] = option.short_pattern || ('--' + key);
        }

        // options.value might be unreal
        if('value' in option){
            default_values[key] = option.value;
        }
    });

    return {
        types: opt_types,
        short: short_hands,
        defaults: default_values,
        options: opts
    };
};


// Parse `process.argv` or something like `process.argv` to data object
parser._parse_argv = function(argv, rules, offset) {
    return nopt(rules.types, rules.short, argv, offset);
};


// Apply `rule.value`
parser._ = function(args, defaults) {
    defaults = defaults || {};

    var key;
    var santitizer;

    var ret = {
        warnings: {},
        errors: {},
        infos: {},
        parsed: args
    };

    for(key in defaults){
        santitizer = defaults[key];

        if(typeof santitizer === 'function'){
            logger._reset();
            args[key] = santitizer(args[key], args, logger);

            logger._get(key, ret);

            if(logger._err()){
                ret.err = true;
                break;
            }

        // default value
        }else if( !(key in args) ){
            args[key] = santitizer;
        }
    }

    return ret;
};

function is_empty_object (object) {
    return !Object.keys(object).length;
}


