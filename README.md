[![Build Status](https://travis-ci.org/kaelzhang/node-clean.png?branch=master)](https://travis-ci.org/kaelzhang/node-clean)

# clean

Clean is small but powerful node.js module that parses and santitize argv or options for node, supporting:

- fully extendable types
- shorthands
- validatiors
- setters

# Installation

```sh
npm install clean --save
```

# Programatical Details

```js
var clean = require('clean')(schema, options);
```


##### Returns `ret` `Object`

##### argv `Array`

`process.argv` or something like that.

##### options `Object`

- rules: `Object` an extended `nopt` rules
- offset: `Number` (optional, default to `2`) the offset from which the parser should start to parse.


## .argv(argv)

Parses the argument vector


## .clean(data, callback)

Cleans the given data according to the `schema`.


## .parseArgv(argv, callback)

Parses argument vector (argv) or something like argv, and cleans the parsed data according to the `schema`.

This method is equivalent to `c.clean(c.argv(argv), callback)`.


#### data `Object`

The given data.

#### callback `function(err, results, details)`


## options.rules


## Example

test.js

```js
var rules = {
    open: {
        type: Boolean,
        value: true
    },

    port: {
        type: Number,
        short: 'p',
        value: function(port, parsed, tool) {
            if(!port){
                port = 9230;
            }

            if(port < 8000){
                tool.warn('port < 8000 which is dangerous');
                
                if(port < 1000){
                	tool.error('port < 100 which is forbidden');
        			return;
                }
            }

            return port;
        }
    },

    html: {
        type: 'html',
    },

    name: {
        type: String
    }
};
```






