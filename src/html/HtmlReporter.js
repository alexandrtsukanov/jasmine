jasmineRequire.HtmlReporter = function(j$) {

  var noopTimer = {
    start: function() {},
    elapsed: function() { return 0; }
  };

  function ResultsStateBuilder() {
    this.topResults = new j$.ResultsNode({}, '', null);
    this.currentParent = this.topResults;
    this.specsExecuted = 0;
    this.failureCount = 0;
    this.pendingSpecCount = 0;
  }

  ResultsStateBuilder.prototype.suiteStarted = function(result) {
    this.currentParent.addChild(result, 'suite');
    this.currentParent = this.currentParent.last();
  };

  ResultsStateBuilder.prototype.suiteDone = function(result) {
    if (this.currentParent !== this.topResults) {
      this.currentParent = this.currentParent.parent;
    }
  };

  ResultsStateBuilder.prototype.specStarted = function(result) {
  };

  ResultsStateBuilder.prototype.specDone = function(result) {
    this.currentParent.addChild(result, 'spec');

    if (result.status !== 'disabled') {
      this.specsExecuted++;
    }

    if (result.status === 'failed') {
      this.failureCount++;
    }

    if (result.status == 'pending') {
      this.pendingSpecCount++;
    }
  };



  function HtmlReporter(options) {
    var env = options.env || {},
      getContainer = options.getContainer,
      createElement = options.createElement,
      createTextNode = options.createTextNode,
      onRaiseExceptionsClick = options.onRaiseExceptionsClick || function() {},
      onThrowExpectationsClick = options.onThrowExpectationsClick || function() {},
      onRandomClick = options.onRandomClick || function() {},
      addToExistingQueryString = options.addToExistingQueryString || defaultQueryString,
      filterSpecs = options.filterSpecs,
      timer = options.timer || noopTimer,
      results = [],
      htmlReporterMain,
      symbols,
      failedSuites = [];

    this.initialize = function() {
      clearPrior();
      htmlReporterMain = createDom('div', {className: 'jasmine_html-reporter'},
        createDom('div', {className: 'jasmine-banner'},
          createDom('a', {className: 'jasmine-title', href: 'http://jasmine.github.io/', target: '_blank'}),
          createDom('span', {className: 'jasmine-version'}, j$.version)
        ),
        createDom('ul', {className: 'jasmine-symbol-summary'}),
        createDom('div', {className: 'jasmine-alert'}),
        createDom('div', {className: 'jasmine-results'},
          createDom('div', {className: 'jasmine-failures'})
        )
      );
      getContainer().appendChild(htmlReporterMain);
    };

    var totalSpecsDefined;
    this.jasmineStarted = function(options) {
      totalSpecsDefined = options.totalSpecsDefined || 0;
      timer.start();
    };

    var summary = createDom('div', {className: 'jasmine-summary'});

    var stateBuilder = new ResultsStateBuilder();

    this.suiteStarted = function(result) {
      stateBuilder.suiteStarted(result);
    };

    this.suiteDone = function(result) {
      if (result.status == 'failed') {
        failedSuites.push(result);
      }

      stateBuilder.suiteDone(result);
    };

    this.specStarted = function(result) {
      stateBuilder.specStarted(result);
    };

    var failures = [];
    this.specDone = function(result) {
      stateBuilder.specDone(result);

      if(noExpectations(result) && typeof console !== 'undefined' && typeof console.error !== 'undefined') {
        console.error('Spec \'' + result.fullName + '\' has no expectations.');
      }

      if (!symbols){
        symbols = find('.jasmine-symbol-summary');
      }

      symbols.appendChild(createDom('li', {
          className: noExpectations(result) ? 'jasmine-empty' : 'jasmine-' + result.status,
          id: 'spec_' + result.id,
          title: result.fullName
        }
      ));

      if (result.status == 'failed') {
        var failure =
          createDom('div', {className: 'jasmine-spec-detail jasmine-failed'},
            failureDescription(result, stateBuilder.currentParent),
            createDom('div', {className: 'jasmine-messages'})
          );
        var messages = failure.childNodes[1];

        for (var i = 0; i < result.failedExpectations.length; i++) {
          var expectation = result.failedExpectations[i];
          messages.appendChild(createDom('div', {className: 'jasmine-result-message'}, expectation.message));
          messages.appendChild(createDom('div', {className: 'jasmine-stack-trace'}, expectation.stack));
        }

        failures.push(failure);
      }
    };

    this.jasmineDone = function(doneResult) {
      var banner = find('.jasmine-banner');
      var alert = find('.jasmine-alert');
      var order = doneResult && doneResult.order;
      alert.appendChild(createDom('span', {className: 'jasmine-duration'}, 'finished in ' + timer.elapsed() / 1000 + 's'));

      banner.appendChild(
        createDom('div', { className: 'jasmine-run-options' },
          createDom('span', { className: 'jasmine-trigger' }, 'Options'),
          createDom('div', { className: 'jasmine-payload' },
            createDom('div', { className: 'jasmine-exceptions' },
              createDom('input', {
                className: 'jasmine-raise',
                id: 'jasmine-raise-exceptions',
                type: 'checkbox'
              }),
              createDom('label', { className: 'jasmine-label', 'for': 'jasmine-raise-exceptions' }, 'raise exceptions')),
            createDom('div', { className: 'jasmine-throw-failures' },
              createDom('input', {
                className: 'jasmine-throw',
                id: 'jasmine-throw-failures',
                type: 'checkbox'
              }),
              createDom('label', { className: 'jasmine-label', 'for': 'jasmine-throw-failures' }, 'stop spec on expectation failure')),
            createDom('div', { className: 'jasmine-random-order' },
              createDom('input', {
                className: 'jasmine-random',
                id: 'jasmine-random-order',
                type: 'checkbox'
              }),
              createDom('label', { className: 'jasmine-label', 'for': 'jasmine-random-order' }, 'run tests in random order'))
          )
        ));

      var raiseCheckbox = find('#jasmine-raise-exceptions');

      raiseCheckbox.checked = !env.catchingExceptions();
      raiseCheckbox.onclick = onRaiseExceptionsClick;

      var throwCheckbox = find('#jasmine-throw-failures');
      throwCheckbox.checked = env.throwingExpectationFailures();
      throwCheckbox.onclick = onThrowExpectationsClick;

      var randomCheckbox = find('#jasmine-random-order');
      randomCheckbox.checked = env.randomTests();
      randomCheckbox.onclick = onRandomClick;

      var optionsMenu = find('.jasmine-run-options'),
          optionsTrigger = optionsMenu.querySelector('.jasmine-trigger'),
          optionsPayload = optionsMenu.querySelector('.jasmine-payload'),
          isOpen = /\bjasmine-open\b/;

      optionsTrigger.onclick = function() {
        if (isOpen.test(optionsPayload.className)) {
          optionsPayload.className = optionsPayload.className.replace(isOpen, '');
        } else {
          optionsPayload.className += ' jasmine-open';
        }
      };

      if (stateBuilder.specsExecuted < totalSpecsDefined) {
        var skippedMessage = 'Ran ' + stateBuilder.specsExecuted + ' of ' + totalSpecsDefined + ' specs - run all';
        var skippedLink = addToExistingQueryString('spec', '');
        alert.appendChild(
          createDom('span', {className: 'jasmine-bar jasmine-skipped'},
            createDom('a', {href: skippedLink, title: 'Run all specs'}, skippedMessage)
          )
        );
      }
      var statusBarMessage = '';
      var statusBarClassName = 'jasmine-overall-result jasmine-bar ';
      var globalFailures = (doneResult && doneResult.failedExpectations) || [];
      var failed = stateBuilder.failureCount + globalFailures.length  + failedSuites.length > 0;

      if (totalSpecsDefined > 0 || failed) {
        statusBarMessage += pluralize('spec', stateBuilder.specsExecuted) + ', ' + pluralize('failure', stateBuilder.failureCount);
        if (stateBuilder.pendingSpecCount) { statusBarMessage += ', ' + pluralize('pending spec', stateBuilder.pendingSpecCount); }
      }

      if (doneResult.overallStatus === 'passed') {
        statusBarClassName += ' jasmine-passed ';
      } else if (doneResult.overallStatus === 'incomplete') {
        statusBarClassName += ' jasmine-incomplete ';
        statusBarMessage = 'Incomplete: ' + doneResult.incompleteReason + ', ' + statusBarMessage;
      } else {
        statusBarClassName += ' jasmine-failed ';
      }

      var seedBar;
      if (order && order.random) {
        seedBar = createDom('span', {className: 'jasmine-seed-bar'},
          ', randomized with seed ',
          createDom('a', {title: 'randomized with seed ' + order.seed, href: seedHref(order.seed)}, order.seed)
        );
      }

      alert.appendChild(createDom('span', {className: statusBarClassName}, statusBarMessage, seedBar));

      var errorBarClassName = 'jasmine-bar jasmine-errored';
      var afterAllMessagePrefix = 'AfterAll ';

      for(var i = 0; i < failedSuites.length; i++) {
        var failedSuite = failedSuites[i];
        for(var j = 0; j < failedSuite.failedExpectations.length; j++) {
          alert.appendChild(createDom('span', {className: errorBarClassName}, afterAllMessagePrefix + failedSuite.failedExpectations[j].message));
        }
      }

      for(i = 0; i < globalFailures.length; i++) {
        alert.appendChild(createDom('span', {className: errorBarClassName}, globalFailureMessage(globalFailures[i])));
      }

      function globalFailureMessage(failure) {
        if (failure.globalErrorType === 'load') {
          var prefix = 'Error during loading: ' + failure.message;

          if (failure.filename) {
            return prefix + ' in ' + failure.filename + ' line ' + failure.lineno;
          } else {
            return prefix;
          }
        } else {
          return afterAllMessagePrefix + failure.message;
        }
      }

      var results = find('.jasmine-results');
      results.appendChild(summary);

      summaryList(stateBuilder.topResults, summary);

      function summaryList(resultsTree, domParent) {
        var specListNode;
        for (var i = 0; i < resultsTree.children.length; i++) {
          var resultNode = resultsTree.children[i];
          if (filterSpecs && !hasActiveSpec(resultNode)) {
            continue;
          }
          if (resultNode.type == 'suite') {
            var suiteListNode = createDom('ul', {className: 'jasmine-suite', id: 'suite-' + resultNode.result.id},
              createDom('li', {className: 'jasmine-suite-detail'},
                createDom('a', {href: specHref(resultNode.result)}, resultNode.result.description)
              )
            );

            summaryList(resultNode, suiteListNode);
            domParent.appendChild(suiteListNode);
          }
          if (resultNode.type == 'spec') {
            if (domParent.getAttribute('class') != 'jasmine-specs') {
              specListNode = createDom('ul', {className: 'jasmine-specs'});
              domParent.appendChild(specListNode);
            }
            var specDescription = resultNode.result.description;
            if(noExpectations(resultNode.result)) {
              specDescription = 'SPEC HAS NO EXPECTATIONS ' + specDescription;
            }
            if(resultNode.result.status === 'pending' && resultNode.result.pendingReason !== '') {
              specDescription = specDescription + ' PENDING WITH MESSAGE: ' + resultNode.result.pendingReason;
            }
            specListNode.appendChild(
              createDom('li', {
                  className: 'jasmine-' + resultNode.result.status,
                  id: 'spec-' + resultNode.result.id
                },
                createDom('a', {href: specHref(resultNode.result)}, specDescription)
              )
            );
          }
        }
      }

      if (failures.length) {
        alert.appendChild(
          createDom('span', {className: 'jasmine-menu jasmine-bar jasmine-spec-list'},
            createDom('span', {}, 'Spec List | '),
            createDom('a', {className: 'jasmine-failures-menu', href: '#'}, 'Failures')));
        alert.appendChild(
          createDom('span', {className: 'jasmine-menu jasmine-bar jasmine-failure-list'},
            createDom('a', {className: 'jasmine-spec-list-menu', href: '#'}, 'Spec List'),
            createDom('span', {}, ' | Failures ')));

        find('.jasmine-failures-menu').onclick = function() {
          setMenuModeTo('jasmine-failure-list');
        };
        find('.jasmine-spec-list-menu').onclick = function() {
          setMenuModeTo('jasmine-spec-list');
        };

        setMenuModeTo('jasmine-failure-list');

        var failureNode = find('.jasmine-failures');
        for (i = 0; i < failures.length; i++) {
          failureNode.appendChild(failures[i]);
        }
      }
    };

    return this;

    function failureDescription(result, suite) {
      var wrapper = createDom('div', {className: 'jasmine-description'},
        createDom('a', {title: result.description, href: specHref(result)}, result.description)
      );
      var suiteLink;

      while (suite && suite.parent) {
        wrapper.insertBefore(createTextNode(' > '), wrapper.firstChild);
        suiteLink = createDom('a', {href: suiteHref(suite)}, suite.result.description);
        wrapper.insertBefore(suiteLink, wrapper.firstChild);

        suite = suite.parent;
      }

      return wrapper;
    }

    function suiteHref(suite) {
      var els = [];

      while (suite && suite.parent) {
        els.unshift(suite.result.description);
        suite = suite.parent;
      }

      return addToExistingQueryString('spec', els.join(' '));
    }

    function find(selector) {
      return getContainer().querySelector('.jasmine_html-reporter ' + selector);
    }

    function clearPrior() {
      // return the reporter
      var oldReporter = find('');

      if(oldReporter) {
        getContainer().removeChild(oldReporter);
      }
    }

    function createDom(type, attrs, childrenVarArgs) {
      var el = createElement(type);

      for (var i = 2; i < arguments.length; i++) {
        var child = arguments[i];

        if (typeof child === 'string') {
          el.appendChild(createTextNode(child));
        } else {
          if (child) {
            el.appendChild(child);
          }
        }
      }

      for (var attr in attrs) {
        if (attr == 'className') {
          el[attr] = attrs[attr];
        } else {
          el.setAttribute(attr, attrs[attr]);
        }
      }

      return el;
    }

    function pluralize(singular, count) {
      var word = (count == 1 ? singular : singular + 's');

      return '' + count + ' ' + word;
    }

    function specHref(result) {
      return addToExistingQueryString('spec', result.fullName);
    }

    function seedHref(seed) {
      return addToExistingQueryString('seed', seed);
    }

    function defaultQueryString(key, value) {
      return '?' + key + '=' + value;
    }

    function setMenuModeTo(mode) {
      htmlReporterMain.setAttribute('class', 'jasmine_html-reporter ' + mode);
    }

    function noExpectations(result) {
      return (result.failedExpectations.length + result.passedExpectations.length) === 0 &&
        result.status === 'passed';
    }

    function hasActiveSpec(resultNode) {
      if (resultNode.type == 'spec' && resultNode.result.status != 'disabled') {
        return true;
      }

      if (resultNode.type == 'suite') {
        for (var i = 0, j = resultNode.children.length; i < j; i++) {
          if (hasActiveSpec(resultNode.children[i])) {
            return true;
          }
        }
      }
    }
  }

  return HtmlReporter;
};
