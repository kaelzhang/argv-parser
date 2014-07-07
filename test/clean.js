'use strict';

var clean = require('../');
var expect = require('chai').expect;

var node_path = require('path');
var node_url = require('url');

var schema = {
  cwd: {
    type: node_path
  },

  a: {
    type: Boolean
  },

  url: {
    type: node_url
  }
};

var shorthands = {
  'c': 'cwd'
}

describe(".parse()", function() {
  it("complex", function(done) {
    clean({
      schema: schema,
      shorthands: shorthands

    }).parse(['node', 'my command', '-c', 'abc', '-a', '--url', 'abc'], function(err, results, details) {
      done();
      expect(err).not.to.equal(null);
      expect(results.cwd).to.equal(node_path.resolve('abc'));
      expect(details.url.error).not.to.equal(null);
    });
  });

  it("#13, default value", function(done){
    var schema = {
      cwd: {
        type: node_path
      },

      a: {
        type: Boolean,
        default: true
      },

      url: {
        type: node_url
      }
    };

    clean({
      schema: schema,
      shorthands: shorthands

    }).parse(['node', 'my command', '-c', 'abc', '--url', 'abc'], function(err, results, details) {
      done();
      expect(err).not.to.equal(null);
      expect(results.cwd).to.equal(node_path.resolve('abc'));
      expect(results.a).to.equal(true);
      expect(details.url.error).not.to.equal(null);
    });
  });

  it("#13, negative default", function(done){
    var schema = {
      cwd: {
        type: node_path
      },

      a: {
        type: Boolean,
        default: true
      },

      url: {
        type: node_url
      }
    };

    clean({
      schema: schema,
      shorthands: shorthands

    }).parse(['node', 'my command', '-c', 'abc', '--url', 'abc', '--no-a'], function(err, results, details) {
      done();
      expect(err).not.to.equal(null);
      expect(results.cwd).to.equal(node_path.resolve('abc'));
      expect(results.a).to.equal(false);
      expect(details.url.error).not.to.equal(null);
    });
  });
});


describe(".argv(argv)", function(){
  it("#12: boolean type", function(){
    var data = clean({
      schema: {
        boolean: {
          type: Boolean
        },
        blah: {
          type: Boolean
        },
        boo: {

        }
      },
      shorthands: {
        'g': 'blah'
      }
    }).argv('node xxxx --boolean abc -g ccc --boo a'.split(' '));
    expect(data.boolean).to.equal(true);
    expect(data.blah).to.equal(true);
    expect(data.boo).to.equal('a');
    expect(data._).to.deep.equal(['abc', 'ccc']);
  });
});


describe(".clean()", function() {
  it("default value of String should be ''", function(done) {
    clean({
      schema: {
        a: {
          type: String
        },
        b: {
          type: String,
          default: null
        }
      }
    }).clean({}, function(err, results) {
      done();

      expect(results.a).to.equal('');
      expect(results.b).to.equal('null');
    });
  });
});
