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
      return !isNaN(value);
    },
    set: function(value) {
      return Number(value);
    }
  },

  boolean: {
    type: Boolean,
    set: function(value) {
      if (value instanceof Boolean) {
        return value.valueOf();

      } else if (typeof value === 'string') {
        if (!isNaN(value)) {
          return !!(+value);

        } else if (value === 'null' || value === 'false') {
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
    set: function(value) {
      var done = this.async();

      var date = Date.parse(value);

      if (isNaN(date)) {
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
    set: function(value) {
      return String(value);
    }
  },

  url: {
    type: node_url,
    set: function(value, is_default) {
      var done = this.async();

      if (is_default && value === undefined) {
        return done(null, value);
      }

      // if the parameter is not string, an error occurs
      var url = node_url.parse(String(value));

      if (!url.host) {
        done({
          code: 'ETYPE',
          message: '"' + value + '" is not a valid url.',
          data: {
            value: value,
            expect: 'url'
          }
        });

      } else {
        done(null, url.href);
      }
    }
  },

  stream: {
    type: node_stream,
    validate: function(value) {
      return value instanceof node_stream;
    }
  },

  path: {
    type: node_path,
    validate: function(value, is_default) {
      var done = this.async();
      if (!is_default && typeof value !== 'string') {
        return done({
          code: 'ETYPE',
          message: '`' + value + '` is not a valid path.',
          data: {
            value: value,
            expect: 'path'
          }
        });
      } else {
        done(null);
      }
    },

    set: function(value, is_default) {
      // we should not convert `undefined` to some path like `/Users/xxx/undefined`
      if (is_default && value === undefined) {
        return value;
      } else {
        return node_path.resolve(String(value));
      }
    }
  }
};
