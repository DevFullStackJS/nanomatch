'use strict';

var path = require('path');
var sep = path.sep;
var mm = require('./support/match');

describe('options', function() {
  describe('options.ignore', function() {
    var negations = ['a/a', 'a/b', 'a/c', 'b/a', 'b/b', 'b/c', 'a/d', 'a/e'];
    var globs = ['a', 'a/a', 'a/a/a', 'a/a/a/a', 'a/a/a/a/a', 'a/a/b', 'a/b', 'a/b/c', 'a/c', 'a/x', 'b', 'b/b/b', 'b/b/c', 'c/c/c', 'e/f/g', 'h/i/a', 'x/x/x', 'x/y', 'z/z', 'z/z/z'];

    it('should filter out ignored patterns', function() {
      var opts = {ignore: ['a/**']};

      mm(globs, '*', ['a', 'b'], opts);
      mm(globs, '*', ['b'], {ignore: '**/a'});
      mm(globs, '*/*', ['x/y', 'z/z'], opts);
      mm(globs, '*/*/*', ['b/b/b', 'b/b/c', 'c/c/c', 'e/f/g', 'h/i/a', 'x/x/x', 'z/z/z'], opts);
      mm(globs, '*/*/*/*', [], opts);
      mm(globs, '*/*/*/*/*', [], opts);
      mm(globs, 'a/*', [], opts);
      mm(globs, '**/*/x', ['x/x/x'], opts);

      mm(negations, '!b/a', ['b/b', 'b/c'], opts);
      mm(negations, '!b/(a)', ['b/b', 'b/c'], opts);
      mm(negations, '!(b/(a))', ['b/b', 'b/c'], opts);
      mm(negations, '!(b/a)', ['b/b', 'b/c'], opts);

      mm(negations, '**', negations, 'nothing is ignored');
      mm(negations, '**', ['a/c', 'a/d', 'a/e', 'b/c'], {ignore: ['*/b', '*/a']});
      mm(negations, '**', [], {ignore: ['**']});
    });

    it('should "un-ignore" values when a negation pattern is passed', function() {
      mm(negations, '**', ['a/d'], {ignore: ['**', '!*/d']});
      mm(negations, '**', ['a/a', 'b/a'], {ignore: ['**', '!*/a']});
    });
  });

  describe('options.matchBase', function() {
    it('should match the basename of file paths when `options.matchBase` is true', function() {
      mm(['a/b/c/d.md'], '*.md', [], 'should not match multiple levels');
      mm(['a/b/c/foo.md'], '*.md', [], 'should not match multiple levels');
      mm(['ab', 'acb', 'acb/', 'acb/d/e', 'x/y/acb', 'x/y/acb/d'], 'a?b', ['acb', 'acb/'], 'should not match multiple levels');
      mm(['a/b/c/d.md'], '*.md', ['a/b/c/d.md'], {matchBase: true});
      mm(['a/b/c/foo.md'], '*.md', ['a/b/c/foo.md'], {matchBase: true});
      mm(['x/y/acb', 'acb/', 'acb/d/e', 'x/y/acb/d'], 'a?b', ['x/y/acb', 'acb/'], {matchBase: true});
    });

    it('should support `options.basename` as an alternative to `matchBase`', function() {
      mm(['a/b/c/d.md'], '*.md', [], 'should not match multiple levels');
      mm(['a/b/c/foo.md'], '*.md', [], 'should not match multiple levels');
      mm(['ab', 'acb', 'acb/', 'acb/d/e', 'x/y/acb', 'x/y/acb/d'], 'a?b', ['acb', 'acb/'], 'should not match multiple levels');
      mm(['a/b/c/d.md'], '*.md', ['a/b/c/d.md'], {basename: true});
      mm(['a/b/c/foo.md'], '*.md', ['a/b/c/foo.md'], {basename: true});
      mm(['x/y/acb', 'acb/', 'acb/d/e', 'x/y/acb/d'], 'a?b', ['x/y/acb', 'acb/'], {basename: true});
    });
  });

  describe('options.flags', function() {
    it('should be case-sensitive by default', function() {
      mm(['a/b/d/e.md'], 'a/b/D/*.md', [], 'should not match a dirname');
      mm(['a/b/c/e.md'], 'A/b/*/E.md', [], 'should not match a basename');
      mm(['a/b/c/e.md'], 'A/b/C/*.MD', [], 'should not match a file extension');
    });

    it('should not be case-sensitive when `i` is set on `options.flags`', function() {
      mm(['a/b/d/e.md'], 'a/b/D/*.md', ['a/b/d/e.md'], {flags: 'i'});
      mm(['a/b/c/e.md'], 'A/b/*/E.md', ['a/b/c/e.md'], {flags: 'i'});
      mm(['a/b/c/e.md'], 'A/b/C/*.MD', ['a/b/c/e.md'], {flags: 'i'});
    });
  });

  describe('options.nocase', function() {
    it('should not be case-sensitive when `options.nocase` is true', function() {
      mm(['a/b/c/e.md'], 'A/b/*/E.md', ['a/b/c/e.md'], {nocase: true});
      mm(['a/b/c/e.md'], 'A/b/C/*.MD', ['a/b/c/e.md'], {nocase: true});
      mm(['a/b/c/e.md'], 'A/b/C/*.md', ['a/b/c/e.md'], {nocase: true});
      mm(['a/b/d/e.md'], 'a/b/D/*.md', ['a/b/d/e.md'], {nocase: true});
    });

    it('should not double-set `i` when both `nocase` and the `i` flag are set', function() {
      var opts = {nocase: true, flags: 'i'};
      mm(['a/b/d/e.md'], 'a/b/D/*.md', opts, ['a/b/d/e.md']);
      mm(['a/b/c/e.md'], 'A/b/*/E.md', opts, ['a/b/c/e.md']);
      mm(['a/b/c/e.md'], 'A/b/C/*.MD', opts, ['a/b/c/e.md']);
    });
  });

  describe('options.nodupes', function() {
    beforeEach(function() {
      path.sep = '\\';
    });
    afterEach(function() {
      path.sep = sep;
    });

    it('should remove duplicate elements from the result array:', function() {
      mm(['abc', '/a/b/c', '\\a\\b\\c'], '/a/b/c', ['/a/b/c'], {});
      mm(['abc', '/a/b/c', '\\a\\b\\c'], '\\a\\b\\c', ['/a/b/c'], {});
      mm(['abc', '/a/b/c', '\\a\\b\\c'], '/a/b/c', ['/a/b/c'], {nodupes: true});
      mm(['abc', '/a/b/c', '\\a\\b\\c'], '\\a\\b\\c', ['/a/b/c'], {nodupes: true});
    });

    it('should not remove duplicates', function() {
      mm(['abc', '/a/b/c', '\\a\\b\\c'], '/a/b/c', ['/a/b/c', '/a/b/c'], {nodupes: false});
      mm(['abc', '/a/b/c', '\\a\\b\\c'], '\\a\\b\\c', ['/a/b/c'], {nodupes: false});
    });
  });

  describe('options.unescape', function() {
    it('should remove backslashes in glob patterns:', function() {
      var fixtures = ['abc', '/a/b/c', '\\a\\b\\c'];
      mm(fixtures, '\\a\\b\\c', ['/a/b/c']);
      mm(fixtures, '\\a\\b\\c', {unescape: true}, ['/a/b/c']);
      mm(fixtures, '\\a\\b\\c', {unescape: true, nodupes: false}, ['/a/b/c']);
    });
  });

  describe('options.nonull', function() {
    it('should return the pattern when no matches are found', function() {
      mm(['a/b/c/e.md'], 'foo/*.md', ['foo/*.md'], {nonull: true});
      mm(['a/b/c/e.md'], 'bar/*.js', ['bar/*.js'], {nonull: true});
    });
  });

  describe('options.nonegate', function() {
    it('should support the `nonegate` option:', function() {
      mm(['a/a/a', 'a/b/a', 'b/b/a', 'c/c/a', 'c/c/b'], '!**/a', ['c/c/b']);
      mm(['.dotfile.txt', 'a/b/.dotfile'], '!*.md', [], {nonegate: true});
      mm(['!a/a/a', 'a/b/a', 'b/b/a', '!c/c/a'], '!**/a', ['!a/a/a', '!c/c/a'], {nonegate: true});
      mm(['!*.md', '.dotfile.txt', 'a/b/.dotfile'], '!*.md', ['!*.md'], {nonegate: true});
    });
  });

  describe('options.unixify', function() {
    it('should unixify file paths', function() {
      mm(['a\\b\\c.md'], '**/*.md', ['a/b/c.md'], {unixify: true});
    });

    it('should unixify absolute paths', function() {
      mm(['E:\\a\\b\\c.md'], 'E:/**/*.md', ['E:/a/b/c.md'], {unixify: true});
    });
  });

  describe('options.dot', function() {
    describe('when `dot` or `dotfile` is NOT true:', function() {
      it('should not match dotfiles by default:', function() {
        mm(['.dotfile'], '*', []);
        mm(['.dotfile'], '**', []);
        mm(['a/b/c/.dotfile.md'], '*.md', []);
        mm(['a/b', 'a/.b', '.a/b', '.a/.b'], '**', ['a/b']);
        mm(['a/b/c/.dotfile'], '*.*', []);

        // https://github.com/isaacs/minimatch/issues/30
        mm(['foo/bar.js'], '**/foo/**', ['foo/bar.js']);
        mm(['./foo/bar.js'], './**/foo/**', ['foo/bar.js']);
        mm(['./foo/bar.js'], '**/foo/**', ['foo/bar.js']);
      });

      it('should match dotfiles when a leading dot is defined in the path:', function() {
        mm(['a/b/c/.dotfile.md'], '**/.*', ['a/b/c/.dotfile.md']);
        mm(['a/b/c/.dotfile.md'], '**/.*.md', ['a/b/c/.dotfile.md']);
      });

      it('should use negation patterns on dotfiles:', function() {
        mm(['.a', '.b', 'c', 'c.md'], '!.*', ['c', 'c.md']);
        mm(['.a', '.b', 'c', 'c.md'], '!.b', ['.a', 'c', 'c.md']);
      });
    });

    describe('when `dot` or `dotfile` is true:', function() {
      it('should match dotfiles when there is a leading dot:', function() {
        var opts = { dot: true };

        mm(['.dotfile'], '*', opts, ['.dotfile']);
        mm(['.dotfile'], '**', opts, ['.dotfile']);
        mm(['a/b', 'a/.b', '.a/b', '.a/.b'], '**', opts, ['a/b', 'a/.b', '.a/b', '.a/.b']);
        mm(['.dotfile'], '.dotfile', opts, ['.dotfile']);
        mm(['.dotfile.md'], '.*.md', opts, ['.dotfile.md']);
      });

      it('should match dotfiles when there is not a leading dot:', function() {
        var opts = { dot: true };
        mm(['.dotfile'], '*.*', opts, ['.dotfile']);
        mm(['.a', '.b', 'c', 'c.md'], '*.*', opts, ['.a', '.b', 'c.md']);
        mm(['.dotfile'], '*.md', opts, []);
        mm(['.verb.txt'], '*.md', opts, []);
        mm(['a/b/c/.dotfile'], '*.md', opts, []);
        mm(['a/b/c/.dotfile.md'], '*.md', opts, []);
        mm(['a/b/c/.verb.md'], '**/*.md', opts, ['a/b/c/.verb.md']);
        mm(['foo.md'], '*.md', opts, ['foo.md']);
      });

      it('should use negation patterns on dotfiles:', function() {
        mm(['.a', '.b', 'c', 'c.md'], '!.*', ['c', 'c.md']);
        mm(['.a', '.b', 'c', 'c.md'], '!(.*)', ['c', 'c.md']);
        mm(['.a', '.b', 'c', 'c.md'], '!(.*)*', ['c', 'c.md']);
        mm(['.a', '.b', 'c', 'c.md'], '!*.*', ['c']);
      });

      it('should match dotfiles when `options.dot` is true:', function() {
        mm(['a/./b', 'a/../b', 'a/c/b', 'a/.d/b'], 'a/.*/b', [ 'a/../b', 'a/./b', 'a/.d/b' ], {dot: true});
        mm(['a/./b', 'a/../b', 'a/c/b', 'a/.d/b'], 'a/.*/b', [ 'a/../b', 'a/./b', 'a/.d/b' ], {dot: false});
        mm(['a/./b', 'a/../b', 'a/c/b', 'a/.d/b'], 'a/*/b', ['a/c/b', 'a/.d/b'], {dot: true});
        mm(['.dotfile'], '*.*', ['.dotfile'], {dot: true});
        mm(['.dotfile'], '*.md', [], {dot: true});
        mm(['.dotfile'], '.dotfile', ['.dotfile'], {dot: true});
        mm(['.dotfile.md'], '.*.md', ['.dotfile.md'], {dot: true});
        mm(['.verb.txt'], '*.md', [], {dot: true});
        mm(['.verb.txt'], '*.md', [], {dot: true});
        mm(['a/b/c/.dotfile'], '*.md', [], {dot: true});
        mm(['a/b/c/.dotfile.md'], '**/*.md', ['a/b/c/.dotfile.md'], {dot: true});
        mm(['a/b/c/.dotfile.md'], '**/.*', ['a/b/c/.dotfile.md']);
        mm(['a/b/c/.dotfile.md'], '**/.*.md', ['a/b/c/.dotfile.md']);
        mm(['a/b/c/.dotfile.md'], '*.md', []);
        mm(['a/b/c/.dotfile.md'], '*.md', [], {dot: true});
        mm(['a/b/c/.verb.md'], '**/*.md', ['a/b/c/.verb.md'], {dot: true});
        mm(['d.md'], '*.md', ['d.md'], {dot: true});
      });
    });
  });

  describe('windows', function() {
    it('should unixify file paths', function() {
      mm(['a\\b\\c.md'], '**/*.md', ['a/b/c.md']);
    });

    it('should unixify absolute paths', function() {
      mm(['E:\\a\\b\\c.md'], 'E:/**/*.md', ['E:/a/b/c.md']);
    });
  });

  describe('normalize', function() {
    it('should normalize leading `./`', function() {
      var fixtures = ['a.md', 'a/b/c.md', 'a/b/d.md', './a/b/c.md', './b/c.md', '.\\a\\b\\c.md'];
      mm(fixtures, '**/*.md', ['a.md', 'a/b/c.md', 'a/b/d.md', 'b/c.md']);
    });

    it('should match leading `./`', function() {
      var fixtures = ['a.md', 'a/b.md', './a.md', './a/b.md', 'a/b/c.md', './a/b/c.md', '.\\a\\b\\c.md', 'a\\b\\c.md'];
      mm(fixtures, '**/*.md', ['a.md', 'a/b.md', 'a/b/c.md']);
      mm(fixtures, '*.md', ['a.md']);
      mm(fixtures, '*/*.md', ['a/b.md']);
      mm(fixtures, './**/*.md', ['a.md', 'a/b.md', 'a/b/c.md']);
      mm(fixtures, './*.md', ['a.md']);
      mm(fixtures, './*/*.md', ['a/b.md']);
      mm(['./a'], 'a', ['a']);
    });
  });
});

