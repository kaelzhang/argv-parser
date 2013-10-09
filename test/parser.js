#!/usr/bin/env node

'use strict';

var parser = require('argv-parser');

var rules = {
    open: {
        type: Boolean,
        value: true
    },

    port: {
        type: Number,
        short: 'p',
        // > 9000 will be more safe
        // NEO -> 230
        value: function(port, parsed, tool) {
            if(!port){
                port = 9230;
            }

            if(port < 8000){
                tool.warn('port < 8000 which is dangerous');
                
                if(port < 100){
                    tool.error('port < 100 which is forbidden');
                    return;
                }
            }

            return port;
        }
    },

    html: {
        type: 'html'
    },

    name: {
        type: String
    },

    abc: {
        type: String
    }
};


console.log(
    'parse >>>>> open:false, port:default:9230:', 

    parser.parse(['node', 'command', '--no-open', '--abc', 'abc', '"abc"', '-p', '999'], {
        rules: rules,
        // offset: 3
    }).parsed
);


