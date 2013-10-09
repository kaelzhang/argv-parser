#!/usr/bin/env node

'use strict';

var clean = require('../');
var expect = require('chai').expect;

var node_path = require('path');
var node_url = require('url');

var schema = {
    cwd: {
        short: 'c',
        type: node_path
    },

    a: {
        type: Boolean
    },

    url: {
        type: node_url
    }
}

describe(".parse()", function(){
    it("complex", function(done){
        clean(schema).parse(['node', 'my command', '-c', 'abc', '-a', '--url', 'abc'], function(err, results, details){
            done();
            expect(err).not.to.equal(null);
            expect(results.cwd).to.equal(node_path.resolve('abc'));
            expect(details.url.error).not.to.equal(null);
            
        });
    });
});