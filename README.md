# Argv-parser

> Argv-parser is a small and simple node.js module to parse `process.argv`

Argv-parser is designed to be simple and will do nothing about:

- option registration
- description of options
- output

## Installation

```sh
npm install argv-parser --save
```

## Usage

```js
var parser = require('argv-parser');
```

## parser.parse(argv, options)

Parse argument vector (argv) or something like argv.

##### Returns `ret` `Object`

- parsed: `Object` the parsed object
- warnings: `Object` the warnings of each option. If not exists, `ret.warning` will be an empty object
- errors: `Object` the errors of each option.

##### argv `Array`

`process.argv` or something like that.

##### options `Object`

- rules: `Object` an extended `nopt` rules
- offset: `Number` (optional, default to `2`) the offset from which the parser should start to parse.


## parser.clean(data, options)

##### Returns

The same as `parser.parse`

##### options `Object`

- rules: `Object`
- types: `Object` (optional) type definitions. For most cases, you needn't this option


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

var data = parser.parse(process.argv, {
	rules: rules
});
```

Default values:

```
$ node test.js
> data.parsed.open; // true
> data.parsed.port; // 9230

```

Type limitation:

```
$ node test.js --port 8888 --no-open --name name<script>alert(123)</script>
> data.parsed.open; // false
> data.parsed.port; // 8888
> data.parsed.name; // 'namealert(123)'; -> stripped
> data.errors;      // {}
> data.warnings;    // {}
```

Warnings and errors:

```
$ node test.js --port 888 --no-open --name name<script>alert(123)</script>
> data.parsed.open; // false
> data.parsed.port; // undefined; -> error
> data.parsed.name; // 'name<script>alert(123)</script>'
> data.errors;      // {port: ['port < 100 which is forbidden']}
> data.warnings;    // {port: ['port < 8000 which is dangerous']}
```






