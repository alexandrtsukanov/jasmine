describe('SetContaining', function() {
  function SetI(iterable) {    // for IE11
    var set = new Set();
    iterable.forEach(function(v) {
      set.add(v);
    });
    return set;
  }

  beforeEach(function() {
    jasmine.getEnv().requireFunctioningSets();
  });


  it('matches any actual set to an empty set', function() {
    var actualSet = new SetI(['foo', 'bar']);
    var containing = new jasmineUnderTest.SetContaining(new Set());
    var matchersUtil = new jasmineUnderTest.MatchersUtil([]);

    expect(containing.asymmetricMatch(actualSet, matchersUtil)).toBe(true);
  });

  it('matches when all the values in sample have matches in actual', function() {
    var actualSet = new SetI([
      {'foo': 'bar'}, 'baz', [1, 2, 3]
    ]);

    var containingSet = new SetI([
      [1, 2, 3], {'foo': 'bar'}
    ]);
    var containing = new jasmineUnderTest.SetContaining(containingSet);
    var matchersUtil = new jasmineUnderTest.MatchersUtil([]);

    expect(containing.asymmetricMatch(actualSet, matchersUtil)).toBe(true);
  });

  it('does not match when a value is not in actual', function() {
    var actualSet = new SetI([
      {'foo': 'bar'}, 'baz', [1, 2, 3]
    ]);

    var containingSet = new SetI([
      [1, 2], {'foo': 'bar'}
    ]);
    var containing = new jasmineUnderTest.SetContaining(containingSet);
    var matchersUtil = new jasmineUnderTest.MatchersUtil([]);

    expect(containing.asymmetricMatch(actualSet, matchersUtil)).toBe(false);
  });

  it('matches when all the values in sample have asymmetric matches in actual', function() {
    var actualSet = new SetI([
      [1, 2, 3, 4], 'other', 'foo1'
    ]);

    var containingSet = new SetI([
      jasmine.stringMatching(/^foo\d/),
      jasmine.arrayContaining([2, 3]),
    ]);
    var containing = new jasmineUnderTest.SetContaining(containingSet);
    var matchersUtil = new jasmineUnderTest.MatchersUtil([]);

    expect(containing.asymmetricMatch(actualSet, matchersUtil)).toBe(true);
  });

  it('does not match when a value in sample has no asymmetric matches in actual', function() {
    var actualSet = new SetI([
      'a-foo1', [1, 2, 3, 4], 'other'
    ]);

    var containingSet = new SetI([
      jasmine.stringMatching(/^foo\d/),
      jasmine.arrayContaining([2, 3]),
    ]);
    var containing = new jasmineUnderTest.SetContaining(containingSet);
    var matchersUtil = new jasmineUnderTest.MatchersUtil([]);

    expect(containing.asymmetricMatch(actualSet, matchersUtil)).toBe(false);
  });

  it('matches recursively', function() {
    var actualSet = new SetI([
      'foo', new SetI([1, 'bar', 2]), 'other'
    ]);

    var containingSet = new SetI([
      new jasmineUnderTest.SetContaining(new SetI(['bar'])), 'foo'
    ]);
    var containing = new jasmineUnderTest.SetContaining(containingSet);
    var matchersUtil = new jasmineUnderTest.MatchersUtil([]);

    expect(containing.asymmetricMatch(actualSet, matchersUtil)).toBe(true);
  });

  it('uses custom equality testers', function() {
    function tester(a, b) {
      // treat all negative numbers as equal
      return (typeof a == 'number' && typeof b == 'number') ? (a < 0 && b < 0) : a === b;
    }
    var actualSet = new SetI(['foo', -1]);
    var containing = new jasmineUnderTest.SetContaining(new SetI([-2, 'foo']));
    var matchersUtil = new jasmineUnderTest.MatchersUtil([tester]);

    expect(containing.asymmetricMatch(actualSet, matchersUtil)).toBe(true);
  });

  it('does not match when actual is not a set', function() {
    var containingSet = new SetI(['foo']);
    var matchersUtil = new jasmineUnderTest.MatchersUtil([]);
    expect(new jasmineUnderTest.SetContaining(containingSet).asymmetricMatch('foo', matchersUtil)).toBe(false);
    expect(new jasmineUnderTest.SetContaining(containingSet).asymmetricMatch(1, matchersUtil)).toBe(false);
    expect(new jasmineUnderTest.SetContaining(containingSet).asymmetricMatch(['foo'], matchersUtil)).toBe(false);
  });

  it('throws an error when sample is not a set', function() {
    var matchersUtil = new jasmineUnderTest.MatchersUtil([]);
    expect(function() {
      new jasmineUnderTest.SetContaining({'foo': 'bar'}).asymmetricMatch(new Set(), matchersUtil);
    }).toThrowError(/You must provide a set/);
  });

  it('defines a `jasmineToString` method', function() {
    var containing = new jasmineUnderTest.SetContaining(new Set());

    expect(containing.jasmineToString()).toMatch(/^<jasmine\.setContaining/);
  });
});