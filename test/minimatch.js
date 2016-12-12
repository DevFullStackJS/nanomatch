'use strict';

var match = require('./support/match');
var patterns = require('./fixtures/patterns');

/**
 * Minimatch comparison tests
 */

describe('basic tests', function() {
  patterns.forEach(function(unit, i) {
    it(i + ': ' + unit[0], function() {
      if (typeof unit === 'string') {
        console.log();
        console.log(' ', unit);
        return;
      }

      // update fixtures list
      if (typeof unit === 'function') {
        unit();
        return;
      }

      var pattern = unit[0];
      var expected = (unit[1] || []).sort(compare);
      var options = unit[2] || {};
      var fixtures = unit[3] || patterns.fixtures;
      match(fixtures, pattern, expected, options);
    });
  });
});

function compare(a, b) {
  return a === b ? 0 : a > b ? 1 : -1;
}
