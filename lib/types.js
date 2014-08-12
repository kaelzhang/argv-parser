'use strict';

var types = exports;

var node_path = require('path');
var node_url = require('url');

types.get = get_type;

function get_type (type, types) {
  var rule = types && types[type] || TYPES[type];

  // type.get('string')
  if (rule) {
    return rule;
  }

  var key;
  var def;

  // type.get(String)
  for (key in TYPES) {
    def = TYPES[key];

    if (type === def.type) {
      return def;
    }
  }

  return;
};


var TYPES = type.TYPES = {
  string: {
    type: String,
    set: function(value, is_default) {
      if (is_default) {
        return '';
      }

      // If is normal string, strip html tags to prevent XSS attack
      return String(value).replace(/<[^>]+>/g, '');
    }
  },

  number: {
    type: Number,
    validate: function(value) {
      var done = this.async();
      if (isNaN(value)) {
        return done(new TypeError('Must be a string.'));
      }

      done(null);
    },
    set: function(value) {
      return Number(value);
    }
  },

  boolean: {
    type: Boolean,
    set: function(value, is_default) {
      if (is_default) {
        return false
      }

      if (value === 'null' || value === 'false') {
        return false;
      }

      if (!isNaN(value)) {
        return !!(+ value);
      }

      return true;
    }
  },

  date: {
    type: Date,
    set: function(value) {
      var done = this.async();
      var date = Date.parse(value);
      if (isNaN(date)) {
        done(new TypeError('"' + value + '" is not a valid date.'));

      } else {
        done(null, new Date(value));
      }
    }
  },

  html: {
    type: 'html',
    set: function(value) {
      return String(value);
    }
  },

  url: {
    type: node_url,
    set: function(value, is_default) {
      var done = this.async();

      if (is_default) {
        return done(null);
      }

      // if the parameter is not string, an error occurs
      var url = node_url.parse(String(value));

      if (!url.host) {
        done(new TypeError('"' + value + '" is not a valid url.'));

      } else {
        done(null, url.href);
      }
    }
  },

  path: {
    type: node_path,
    set: function(value, is_default) {
      // we should not convert `undefined` to some path like `/Users/xxx/undefined`
      if (is_default) {
        return value;
      } else {
        return node_path.resolve(String(value));
      }
    }
  }
};
