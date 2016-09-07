'use strict';

var path = require('path');
var util = require('util');
var debug = require('debug')('nanomatch');
var Nanomatch = require('./lib/nanomatch');
var compilers = require('./lib/compilers');
var parsers = require('./lib/parsers');
var utils = require('./lib/utils');
var regexCache = {};

/**
 * Convert the given `glob` pattern into a regex-compatible string.
 *
 * ```js
 * var nanomatch = require('nanomatch');
 * var str = nanomatch('*.!(*a)');
 * console.log(str);
 * ```
 * @param {String} `str`
 * @param {Object} `options`
 * @return {String}
 * @api public
 */

function nanomatch(str, options) {
  var matcher = new Nanomatch(options);
  var ast = matcher.parse(str, options);
  return matcher.compile(ast, options);
}

/**
 * Takes an array of strings and a glob pattern and returns a new
 * array that contains only the strings that match the pattern.
 *
 * ```js
 * var nano = require('nanomatch');
 * console.log(nano.match(['a.a', 'a.b', 'a.c'], '*.!(*a)'));
 * //=> ['a.b', 'a.c']
 * ```
 * @param {Array} `arr` Array of strings to match
 * @param {String} `pattern` Glob pattern
 * @param {Object} `options`
 * @return {Array}
 * @api public
 */

nanomatch.match = function(files, pattern, options) {
  var opts = utils.extend({}, options);
  var isMatch = nanomatch.matcher(pattern, opts);
  var unixify = utils.unixify(opts);
  var matches = [];

  files = utils.arrayify(files);
  var len = files.length;
  var idx = -1;

  while (++idx < len) {
    var file = unixify(files[idx]);
    if (isMatch(file)) {
      matches.push(file);
    }
  }

  if (matches.length === 0) {
    if (opts.failglob === true) {
      throw new Error('no matches found for "' + pattern + '"');
    }
    if (opts.nonull === true || opts.nullglob === true) {
      return [pattern.split('\\').join('')];
    }
  }

  // if `ignore` was defined, diff ignored files
  if (opts.ignore) {
    var ignore = utils.arrayify(opts.ignore);
    delete opts.ignore;
    var ignored = nanomatch.matchEach(matches, ignore, opts);
    matches = utils.diff(matches, ignored);
  }
  return opts.nodupes ? utils.unique(matches) : matches;
};

/**
 * Takes an array of strings and a one or more glob patterns and returns a new
 * array with strings that match any of the given patterns.
 *
 * ```js
 * var nano = require('nanomatch');
 * console.log(nano.matchEach(['a.a', 'a.b', 'a.c'], ['*.!(*a)']));
 * //=> ['a.b', 'a.c']
 * ```
 * @param {Array} `arr` Array of strings to match
 * @param {String} `pattern` Glob pattern
 * @param {Object} `options`
 * @return {Array}
 * @api public
 */

nanomatch.matchEach = function(files, patterns, options) {
  if (!Array.isArray(files)) {
    return [];
  }

  if (!Array.isArray(patterns)) {
    return nanomatch.match.apply(nanomatch, arguments);
  }

  var opts = utils.extend({cache: true}, options);
  var omit = [];
  var keep = [];

  var len = patterns.length;
  var idx = -1;

  while (++idx < len) {
    var pattern = patterns[idx];
    if (typeof pattern === 'string' && pattern.charCodeAt(0) === 33 /* ! */) {
      omit.push.apply(omit, nanomatch.match(files, pattern.slice(1), opts));
    } else {
      keep.push.apply(keep, nanomatch.match(files, pattern, opts));
    }
  }
  return utils.diff(keep, omit);
};

/**
 * Returns true if a file path matches any of the
 * given patterns.
 *
 * @param  {String} `fp` The filepath to test.
 * @param  {String|Array} `patterns` Glob patterns to use.
 * @param  {Object} `opts` Options to pass to the `matcher()` function.
 * @return {String}
 */

nanomatch.any = function(filepath, patterns, options) {
  if (!Array.isArray(patterns) && typeof patterns !== 'string') {
    throw new TypeError('expected patterns to be a string or array');
  }

  var unixify = utils.unixify(opts);
  var opts = utils.extend({}, options);

  patterns = utils.arrayify(patterns);
  filepath = unixify(filepath);
  var len = patterns.length;

  for (var i = 0; i < len; i++) {
    var pattern = patterns[i];
    if (!utils.isString(pattern)) {
      continue;
    }

    if (!utils.isGlob(pattern)) {
      if (filepath === pattern) {
        return true;
      }
      if (opts.contains && filepath.indexOf(pattern) !== -1) {
        return true;
      }
      continue;
    }

    if (nanomatch.isMatch(filepath, pattern, opts)) {
      return true;
    }
  }
  return false;
};

/**
 * Returns true if the filepath matches the
 * given pattern.
 */

nanomatch.contains = function(filepath, pattern, options) {
  if (typeof filepath !== 'string') {
    throw new TypeError('expected filepath to be a string');
  }
  if (typeof pattern !== 'string') {
    throw new TypeError('expected pattern to be a string');
  }

  var opts = utils.extend({contains: pattern !== ''}, options);
  opts.strictClose = false;
  opts.strictOpen = false;

  if (opts.contains && !utils.isGlob(pattern)) {
    filepath = utils.unixify(opts)(filepath);
    return filepath.indexOf(pattern) !== -1;
  }
  return nanomatch.matcher(pattern, opts)(filepath);
};

/**
 * Returns true if the specified `string` matches the given
 * glob `pattern`.
 *
 * ```js
 * var nano = require('nanomatch');
 *
 * console.log(nano.isMatch('a.a', '*.!(*a)'));
 * //=> false
 * console.log(nano.isMatch('a.b', '*.!(*a)'));
 * //=> true
 * ```
 * @param {String} `string` String to match
 * @param {String} `pattern` Glob pattern
 * @param {String} `options`
 * @return {Boolean}
 * @api public
 */

nanomatch.isMatch = function(filepath, pattern, options) {
  if (pattern === '' || pattern === ' ') {
    return filepath === pattern;
  }

  var opts = utils.extend({}, options);
  if (nanomatch.matchBase(pattern, opts)) {
    filepath = path.basename(filepath);

  } else if (opts.extname === true) {
    filepath = path.extname(filepath);

  } else if (opts.dirname === true) {
    filepath = path.dirname(filepath);
  }

  var re = nanomatch.makeRe(pattern, utils.extend({prepend: false}, opts));
  return re.test(filepath);
};

/**
 * Takes a glob pattern and returns a matcher function. The returned
 * function takes the string to match as its only argument.
 *
 * ```js
 * var nano = require('nanomatch');
 * var isMatch = nanomatch.matcher('*.!(*a)');
 *
 * console.log(isMatch('a.a'));
 * //=> false
 * console.log(isMatch('a.b'));
 * //=> true
 * ```
 * @param {String} `pattern` Glob pattern
 * @param {String} `options`
 * @return {Boolean}
 * @api public
 */

nanomatch.matcher = function(pattern, options) {
  // pattern is a function
  if (typeof pattern === 'function') {
    return pattern;
  }

  var opts = utils.extend({}, options);
  var unixify = utils.unixify(opts);

  // pattern is a regex
  if (pattern instanceof RegExp) {
    return function(fp) {
      return pattern.test(unixify(fp));
    };
  }

  if (typeof pattern !== 'string') {
    throw new TypeError('expected pattern to be a string, regex or function');
  }

  // pattern is a non-glob string
  if (!utils.hasSpecialChars(pattern)) {
    return utils.matchPath(unixify(pattern), opts);
  }

  // pattern is a glob string
  var re = nanomatch.makeRe(pattern, utils.extend({prepend: false}, opts));

  // `matchBase` is defined
  if (nanomatch.matchBase(pattern, options)) {
    return utils.matchBasename(re);
  }

  // `matchBase` is not defined
  return function(fp) {
    return re.test(unixify(fp));
  };
};

/**
 * Returns true if the given pattern and options should enable
 * the `matchBase` option.
 * @return {Boolean}
 */

nanomatch.matchBase = function(pattern, options) {
  if (pattern && pattern.indexOf('/') !== -1 || !options) return false;
  return options.basename === true
    || options.matchBase === true;
};

/**
 * Create a regular expression from the given string `pattern`.
 *
 * ```js
 * var nanomatch = require('nanomatch');
 * var re = nanomatch.makeRe('[[:alpha:]]');
 * console.log(re);
 * //=> /^(?:[a-zA-Z])$/
 * ```
 * @param {String} `pattern` The pattern to convert to regex.
 * @param {Object} `options`
 * @return {RegExp}
 * @api public
 */

nanomatch.makeRe = function(pattern, options) {
  var key = pattern;
  var regex;

  if (options) {
    for (var prop in options) {
      if (options.hasOwnProperty(prop)) {
        key += ';' + prop + '=' + String(options[prop]);
      }
    }
  }

  options = options || {};
  if (options.cache !== false && regexCache.hasOwnProperty(key)) {
    return regexCache[key];
  }

  var nm = new Nanomatch(options);
  regex = regexCache[key] = nm.makeRe(pattern, options);
  return regex;
};

/**
 * Expose `Nanomatch` constructor
 * @type {Function}
 */

module.exports = nanomatch;
module.exports.Nanomatch = Nanomatch;
module.exports.compilers = compilers;
module.exports.parsers = parsers;
