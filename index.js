'use strict';

var nopt = require('nopt');
var parser = module.exports = {};

//  0       1           2          3
// ['node', __filename, <command>, [options] ]
parser.PARSE_ARGV_OFFSET = 2;

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

// {
//     String: {
//         type: String,

//         // function(data, key, value)
//         validate: validateString
//     }
// }

// So that we will not 
parser.TYPES = mix({}, nopt.typeDefs);

parser.TYPES.html = {
    type: 'html',
    validate: function(data, key, value) {
        data[key] = String(value);
    }
};

parser.TYPES.String = {
    type: String,

    // If is normal string, strip html tags to prevent XSS attack
    validate: function (data, key, value) {
        if(value){
            data[key] = String(value).replace(/<[^>]+>/g, '');
        }
    }
};


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


var logger = {
    warn: function (data) {
        this.warnings.push(data);
    },

    error: function (data) {
        this.errors.push(data);
    },

    info: function (data) {
        this.infos.push(data);
    }
};


Object.defineProperties(logger, {
    _reset: {
        value: function () {
            this.warnings = [];
            this.errors = [];
            this.infos = [];
        }
    },

    warnings: {
        writable: true
    },

    errors: {
        writable: true
    },

    infos: {
        writable: true
    },

    _err: {
        value: function () {
            return !!this.errors.length;
        }  
    },

    _get: {
        value: function (key, host) {
            this._(key, 'warnings', host);
            this._(key, 'errors', host);
            this._(key, 'infos', host);
        }
    },

    _: {
        value: function (key, type, host) {
            if(this[type].length){
                host[type][key] = this[type];
            }
        }
    }
});

