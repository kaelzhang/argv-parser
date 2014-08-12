'use strict';

var Cleaner = require('../lib/cleaner');
var expect = require('chai').expect;

describe("cleaner", function(){
  it("normal, only setter", function(done){
    var c = new Cleaner({
      set: function (v) {
        return v + 1;
      }
    }, {}, 'a');

    c.clean(1, [], function (err, v) {
      expect(err).to.equal(null);
      expect(v).to.equal(2);
      done();
    });
  });

  it("normal, only validator", function(done){
    var c = new Cleaner({
      validate: function (v) {
        return v > 0;
      }
    }, {}, 'a');

    c.clean(1, [], function (err, v) {
      expect(err).to.equal(null);

      c.clean(0, [], function (err, v) {
        expect(err).not.to.equal(null);
        done();
      });
    });
  });

  it("required", function(done){
    var c = new Cleaner({
      required: true
    }, {}, 'a');

    c.clean(undefined, [true], function (err, v) {
      expect(err).not.to.equal(null);
      done();
    });
  });
});


describe("types", function(){
  var cases = [
    // type, value, is_default, err, value
    ['Number', '1', false, null, 1],
    ['Number', 1, true, null, 1],
    ['Number', 'a', false, TypeError],
    ['String', undefined, true, null, ''],
    ['String', 'undefined', false, null, 'undefined']
  ];

  cases.forEach(function (c) {
    var t = c[0];
    var v = c[1];
    var args = [c[2]];
    var e = c[3];
    var nv = c[4];
    it(c.join(', '), function(done){
      var cleaner = new Cleaner({
        type: t
      }, {});

      cleaner.clean(v, args, function (err, value) {
        if (e === null) {
          expect(err).to.equal(e);
          expect(value).to.equal(nv);
        } else {
          expect(err instanceof e).to.equal(true);
        }

        done();
      });
    });
  });
});
