'use strict';

var path = require('path');
var assert = require('assert');
var mm = require('..');

// windows
var opts = path.sep === '/' ? { unixify: true } : {};

describe('.contains()', function() {
  describe('error handling', function() {
    it('should throw on invalid argument:', function() {
      assert.throws(function() {
        mm.contains();
      }, /expected a string/);
    });

    it('should throw on invalid pattern:', function() {
      assert.throws(function() {
        mm.contains('', {});
      }, /expected pattern to be a string/);
    });
  });

  describe('patterns', function() {
    it('should correctly deal with empty patterns', function() {
      assert(!mm.contains('ab', ''));
      assert(!mm.contains('a', ''));
      assert(!mm.contains('.', ''));
    });

    it('should return true when the path contains the pattern', function() {
      assert(mm.contains('ab', 'b'));
      assert(mm.contains('.', '.'));
      assert(mm.contains('a/b/c', 'a/b'));
      assert(mm.contains('/ab', '/a'));
      assert(mm.contains('a', 'a'));
      assert(mm.contains('ab', 'a'));
      assert(mm.contains('ab', 'ab'));
      assert(mm.contains('abcd', 'd'));
      assert(mm.contains('abcd', 'c'));
      assert(mm.contains('abcd', 'cd'));
      assert(mm.contains('abcd', 'bc'));
      assert(mm.contains('abcd', 'ab'));
    });

    it('should match with common glob patterns', function() {
      assert(mm.contains('a/b/c', 'a/*'));
      assert(mm.contains('/ab', '/a'));
      assert(mm.contains('/ab', '/*'));
      assert(mm.contains('/cd', '/*'));
      assert(mm.contains('ab', '*'));
      assert(mm.contains('ab', 'ab'));
      assert(mm.contains('/ab', '*/a'));
      assert(mm.contains('/ab', '*/'));
      assert(mm.contains('/ab', '*/*'));
      assert(mm.contains('/ab', '/'));
      assert(mm.contains('/ab', '/??'));
      assert(mm.contains('/ab', '/?b'));
      assert(mm.contains('/ab', '/?'));
      assert(mm.contains('a/b', '?/?'));

      // windows
      assert(mm.contains('a\\b\\c', 'a/*', opts));
      assert(mm.contains('\\ab', '/a', opts));
      assert(mm.contains('\\ab', '/*', opts));
      assert(mm.contains('\\cd', '/*', opts));
      assert(mm.contains('ab', '*', opts));
      assert(mm.contains('ab', 'ab', opts));
      assert(mm.contains('\\ab', '*/a', opts));
      assert(mm.contains('\\ab', '*/', opts));
      assert(mm.contains('\\ab', '*/*', opts));
      assert(mm.contains('\\ab', '/', opts));
      assert(mm.contains('\\ab', '/??', opts));
      assert(mm.contains('\\ab', '/?b', opts));
      assert(mm.contains('\\ab', '/?', opts));
      assert(mm.contains('a\\b', '?/?', opts));
    });

    it('should return false when the path does not contain the pattern', function() {
      assert(!mm.contains('/ab', '?/?'));
      assert(!mm.contains('ab', '*/*'));
      assert(!mm.contains('abcd', 'f'));
      assert(!mm.contains('ab', 'c'));
      assert(!mm.contains('ab', '/a'));
      assert(!mm.contains('/ab', 'a/*'));
      assert(!mm.contains('ef', '/*'));
    });

    it('should match files that contain the given extension:', function() {
      assert(mm.contains('ab', './*'));
      assert(mm.contains('.c.md', '*.md'));
      assert(mm.contains('.c.md', '.*.md'));
      assert(mm.contains('.c.md', '.c.'));
      assert(mm.contains('.c.md', '.md'));
      assert(mm.contains('.md', '.m'));
      assert(mm.contains('a/b/c.md', '**/*.md'));
      assert(mm.contains('a/b/c.md', '*.md'));
      assert(mm.contains('a/b/c.md', '.md'));
      assert(mm.contains('a/b/c.md', 'a/*/*.md'));
      assert(mm.contains('a/b/c/c.md', '*.md'));
      assert(mm.contains('c.md', '*.md'));

      // windows
      assert(mm.contains('a\\b\\c.md', '**/*.md', opts));
      assert(mm.contains('a\\b\\c.md', '*.md', opts));
      assert(mm.contains('a\\b\\c.md', '.md', opts));
      assert(mm.contains('a\\b\\c.md', 'a/*/*.md', opts));
      assert(mm.contains('a\\b\\c\\c.md', '*.md', opts));
    });

    it('should not match files that do not contain the given extension:', function() {
      assert(!mm.contains('.md', '*.md'));
      assert(!mm.contains('a/b/c/c.md', 'c.js'));
      assert(!mm.contains('a/b/c.md', 'a/*.md'));
    });

    it('should match dotfiles when a dot is explicitly defined in the pattern:', function() {
      assert(mm.contains('.a', '.a'));
      assert(mm.contains('.ab', '.*'));
      assert(mm.contains('.ab', '.a*'));
      assert(mm.contains('.abc', '.a'));
      assert(mm.contains('.b', '.b*'));
      assert(mm.contains('.c.md', '*.md'));
      assert(mm.contains('.md', '.md'));
      assert(mm.contains('a/.c.md', '*.md'));
      assert(mm.contains('a/.c.md', 'a/.c.md'));
      assert(mm.contains('a/b/c/.xyz.md', 'a/b/c/.*.md'));
      assert(mm.contains('a/b/c/d.a.md', 'a/b/c/*.md'));

      assert(mm.contains('a\\.c.md', 'a/.c.md', opts));
      assert(mm.contains('a\\b\\c\\.xyz.md', 'a/b/c/.*.md', opts));
      assert(mm.contains('a\\.c.md', '*.md', opts));
      assert(mm.contains('a\\b\\c\\d.a.md', 'a/b/c/*.md', opts));
    });

    it('should match dotfiles when `dot` or `dotfiles` is set:', function() {
      assert(mm.contains('.c.md', '*.md', {dot: true}));
      assert(mm.contains('.c.md', '.*', {dot: true}));
      assert(mm.contains('a/b/c/.xyz.md', '**/*.md', {dot: true}));
      assert(mm.contains('a/b/c/.xyz.md', '**/.*.md', {dot: true}));
      assert(mm.contains('a/b/c/.xyz.md', '.*.md', {dot: true}));
      assert(mm.contains('a/b/c/.xyz.md', 'a/b/c/*.md', {dot: true}));
      assert(mm.contains('a/b/c/.xyz.md', 'a/b/c/.*.md', {dot: true}));

      assert(mm.contains('a\\b\\c\\.xyz.md', '.*.md', {unixify: true, dot: true}));
      assert(mm.contains('.c.md', '*.md', {unixify: true, dot: true}));
      assert(mm.contains('.c.md', '.*', {unixify: true, dot: true}));
      assert(mm.contains('a\\b\\c\\.xyz.md', '**/*.md', {unixify: true, dot: true}));
      assert(mm.contains('a\\b\\c\\.xyz.md', '**/.*.md', {unixify: true, dot: true}));
      assert(mm.contains('a\\b\\c\\.xyz.md', 'a/b/c/*.md', {unixify: true, dot: true}));
      assert(mm.contains('a\\b\\c\\.xyz.md', 'a/b/c/.*.md', {unixify: true, dot: true}));
    });

    it('should not match dotfiles when `dot` or `dotfiles` is not set:', function() {
      assert(!mm.contains('.a', '*.md'));
      assert(!mm.contains('.ba', '.a'));
      assert(!mm.contains('.a.md', 'a/b/c/*.md'));
      assert(!mm.contains('.ab', '*.*'));
      assert(!mm.contains('.md', 'a/b/c/*.md'));
      assert(!mm.contains('.txt', '.md'));
      assert(!mm.contains('.verb.txt', '*.md'));
      assert(!mm.contains('a/b/d/.md', 'a/b/c/*.md'));
      assert(!mm.contains('a\\b\\d\\.md', 'a/b/c/*.md', opts));
    });

    it('should match file paths:', function() {
      assert(mm.contains('a/b/c/xyz.md', 'a/b/c/*.md'));
      assert(mm.contains('a/bb/c/xyz.md', 'a/*/c/*.md'));
      assert(mm.contains('a/bbbb/c/xyz.md', 'a/*/c/*.md'));
      assert(mm.contains('a/bb.bb/c/xyz.md', 'a/*/c/*.md'));
      assert(mm.contains('a/bb.bb/aa/bb/aa/c/xyz.md', 'a/**/c/*.md'));
      assert(mm.contains('a/bb.bb/aa/b.b/aa/c/xyz.md', 'a/**/c/*.md'));

      // windows
      assert(mm.contains('a\\b\\c\\xyz.md', 'a/b/c/*.md', opts));
      assert(mm.contains('a\\bb\\c\\xyz.md', 'a/*/c/*.md', opts));
      assert(mm.contains('a\\bbbb\\c\\xyz.md', 'a/*/c/*.md', opts));
      assert(mm.contains('a\\bb.bb\\c\\xyz.md', 'a/*/c/*.md', opts));
      assert(mm.contains('a\\bb.bb\\aa\\bb\\aa\\c\\xyz.md', 'a/**/c/*.md', opts));
      assert(mm.contains('a\\bb.bb\\aa\\b.b\\aa\\c\\xyz.md', 'a/**/c/*.md', opts));
    });

    it('should return true when full file paths are matched:', function() {
      assert(mm.contains('a/.b', 'a/.*'));
      assert(mm.contains('a/.b', 'a/'));
      assert(mm.contains('a/b/z/.a', 'b/z'));
      assert(mm.contains('a/b/z/.a', 'a/*/z/.a'));
      assert(mm.contains('a/b/c/d/e/z/c.md', 'a/**/z/*.md'));
      assert(mm.contains('a/b/c/d/e/z/c.md', 'b/c/d/e'));
      assert(mm.contains('a/b/c/d/e/j/n/p/o/z/c.md', 'a/**/j/**/z/*.md'));

      // windows
      assert(mm.contains('a\\.b', 'a/.*', opts));
      assert(mm.contains('a\\.b', 'a/', opts));
      assert(mm.contains('a\\b\\z\\.a', 'b/z', opts));
      assert(mm.contains('a\\b\\z\\.a', 'a/*/z/.a', opts));
      assert(mm.contains('a\\b\\c\\d\\e\\z\\c.md', 'a/**/z/*.md', opts));
      assert(mm.contains('a\\b\\c\\d\\e\\z\\c.md', 'b/c/d/e', opts));
      assert(mm.contains('a\\b\\c\\d\\e\\j\\n\\p\\o\\z\\c.md', 'a/**/j/**/z/*.md', opts));
    });

    it('should match path segments:', function() {
      assert(mm.contains('aaa', 'aaa'));
      assert(mm.contains('aaa', 'aa'));
      assert(mm.contains('aaa/bbb', 'aaa/bbb'));
      assert(mm.contains('aaa/bbb', 'aaa/*'));
      assert(mm.contains('aaa/bba/ccc', '**/*/ccc'));
      assert(mm.contains('aaa/bba/ccc', '*/*a'));
      assert(mm.contains('aaa/bba/ccc', 'aaa*'));
      assert(mm.contains('aaa/bba/ccc', 'aaa**'));
      assert(mm.contains('aaa/bba/ccc', 'aaa/*'));
      assert(mm.contains('aaa/bba/ccc', 'aaa/**'));
      assert(mm.contains('aaa/bba/ccc', 'aaa/*/ccc'));
      assert(mm.contains('aaa/bba/ccc', 'bb'));
      assert(mm.contains('aaa/bba/ccc', 'bb*'));
      assert(!mm.contains('aaa/bba/ccc', 'aaa/*ccc'));
      assert(!mm.contains('aaa/bba/ccc', 'aaa/**ccc'));
      assert(!mm.contains('aaa/bba/ccc', 'aaa/*z'));
      assert(!mm.contains('aaa/bba/ccc', 'aaa/**z'));
      assert(mm.contains('aaa/bbb', 'aaa[/]bbb'));
      assert(!mm.contains('aaa', '*/*/*'));
      assert(!mm.contains('aaa/bbb', '*/*/*'));
      assert(mm.contains('aaa/bba/ccc', '*/*/*'));
      assert(mm.contains('aaa/bb/aa/rr', '*/*/*'));
      assert(mm.contains('abzzzejklhi', '*j*i'));
      assert(mm.contains('ab/zzz/ejkl/hi', '*/*z*/*/*i'));
      assert(mm.contains('ab/zzz/ejkl/hi', '*/*jk*/*i'));

      // windows
      assert(mm.contains('aaa\\bbb', 'aaa/bbb', opts));
      assert(mm.contains('aaa\\bbb', 'aaa/*', opts));
      assert(mm.contains('aaa\\bba\\ccc', '**/*/ccc', opts));
      assert(mm.contains('aaa\\bba\\ccc', '*/*a', opts));
      assert(mm.contains('aaa\\bba\\ccc', 'aaa*', opts));
      assert(mm.contains('aaa\\bba\\ccc', 'aaa**', opts));
      assert(mm.contains('aaa\\bba\\ccc', 'aaa/*', opts));
      assert(mm.contains('aaa\\bba\\ccc', 'aaa/**', opts));
      assert(mm.contains('aaa\\bba\\ccc', 'aaa/*/ccc', opts));
      assert(mm.contains('aaa\\bba\\ccc', 'bb', opts));
      assert(mm.contains('aaa\\bba\\ccc', 'bb*', opts));
      assert(mm.contains('aaa\\bbb', 'aaa[/]bbb', opts));
      assert(mm.contains('aaa\\bbb', 'aaa[\\\\/]bbb', opts));
      assert(!mm.contains('aaa\\bba\\ccc', 'aaa/*ccc', opts));
      assert(!mm.contains('aaa\\bba\\ccc', 'aaa/**ccc', opts));
      assert(!mm.contains('aaa\\bba\\ccc', 'aaa/*z', opts));
      assert(!mm.contains('aaa\\bba\\ccc', 'aaa/**z', opts));
      assert(!mm.contains('\\aaa', '*/*/*', opts));
      assert(!mm.contains('aaa\\bbb', '*/*/*', opts));
      assert(mm.contains('aaa\\bba\\ccc', '*/*/*', opts));
      assert(mm.contains('aaa\\bb\\aa\\rr', '*/*/*', opts));
      assert(mm.contains('ab\\zzz\\ejkl\\hi', '*/*z*/*/*i', opts));
      assert(mm.contains('ab\\zzz\\ejkl\\hi', '*/*jk*/*i', opts));
    });

    it('should return false when full file paths are not matched:', function() {
      assert(!mm.contains('a/b/z/.a', 'b/a'));
      assert(!mm.contains('a/.b', 'a/**/z/*.md'));
      assert(!mm.contains('a/b/z/.a', 'a/**/z/*.a'));
      assert(!mm.contains('a/b/z/.a', 'a/*/z/*.a'));
      assert(!mm.contains('a/b/c/j/e/z/c.txt', 'a/**/j/**/z/*.md'));

      // windows
      assert(!mm.contains('a\\b\\z\\.a', 'b/a', opts));
      assert(!mm.contains('a\\.b', 'a/**/z/*.md', opts));
      assert(!mm.contains('a\\b\\z\\.a', 'a/**/z/*.a', opts));
      assert(!mm.contains('a\\b\\z\\.a', 'a/*/z/*.a', opts));
      assert(!mm.contains('a\\b\\c\\j\\e\\z\\c.txt', 'a/**/j/**/z/*.md', opts));
    });

    it('should match paths with leading `./`:', function() {
      assert(!mm.contains('./.a', 'a/**/z/*.md'));
      assert(mm.contains('./a/b/z/.a', 'a/**/z/.a'));
      assert(mm.contains('./a/b/z/.a', './a/**/z/.a'));
      assert(mm.contains('./a/b/c/d/e/z/c.md', 'a/**/z/*.md'));
      assert(mm.contains('./a/b/c/d/e/z/c.md', './a/**/z/*.md'));
      assert(!mm.contains('./a/b/c/d/e/z/c.md', './a/**/j/**/z/*.md'));
      assert(mm.contains('./a/b/c/j/e/z/c.md', './a/**/j/**/z/*.md'));
      assert(mm.contains('./a/b/c/j/e/z/c.md', 'a/**/j/**/z/*.md'));
      assert(mm.contains('./a/b/c/d/e/j/n/p/o/z/c.md', './a/**/j/**/z/*.md'));
      assert(!mm.contains('./a/b/c/j/e/z/c.txt', './a/**/j/**/z/*.md'));

      // windows
      assert(!mm.contains('.\\.a', 'a/**/z/*.md', opts));
      assert(mm.contains('.\\a\\b\\z\\.a', 'a/**/z/.a', opts));
      assert(mm.contains('.\\a\\b\\z\\.a', './a/**/z/.a', opts));
      assert(mm.contains('.\\a\\b\\c\\d\\e\\z\\c.md', 'a/**/z/*.md', opts));
      assert(mm.contains('.\\a\\b\\c\\d\\e\\z\\c.md', './a/**/z/*.md', opts));
      assert(!mm.contains('.\\a\\b\\c\\d\\e\\z\\c.md', './a/**/j/**/z/*.md', opts));
      assert(mm.contains('.\\a\\b\\c\\j\\e\\z\\c.md', './a/**/j/**/z/*.md', opts));
      assert(mm.contains('.\\a\\b\\c\\j\\e\\z\\c.md', 'a/**/j/**/z/*.md', opts));
      assert(mm.contains('.\\a\\b\\c\\d\\e\\j\\n\\p\\o\\z\\c.md', './a/**/j/**/z/*.md', opts));
      assert(!mm.contains('.\\a\\b\\c\\j\\e\\z\\c.txt', './a/**/j/**/z/*.md', opts));
    });
  });
});
