//
// Runs a folder of tests or a single test, using Jasmine and outputs a JUnit xml file ready for sweet integration with your CI server.
//
// @usage
// phantomjs JasmineRunner.js --tests=runner.html --outputfilename=test.xml -baseurl=http://example.com/tests/ --timeout=30000
(function () {

    function poll(testFn, onReady, onError, timeOutMillis) {
        var maxtimeOutMillis = timeOutMillis || 3001, //< Default Max Timeout is 3s
            start = new Date().getTime(),
            condition = false,
            interval = setInterval(function () {
                if ((new Date().getTime() - start < maxtimeOutMillis) && !condition) {
                    // If not time-out yet and condition not yet fulfilled
                    condition = (typeof (testFn) === 'string' ? eval(testFn) : testFn()); //< defensive code
                } else {
                    if (!condition) {
                        //   If condition still not fulfilled (timeout but condition is 'false')
                        console.log('poll() timeout - ' + maxtimeOutMillis);
                        typeof (onError) === 'string' ? eval(onError) : onError(); //< Do what it's supposed to do once the condition has errore
                    } else {
                        //   Condition fulfilled (timeout and/or condition is 'true')
                        console.debug('poll() finished in ' + (new Date().getTime() - start) + 'ms');
                        typeof (onReady) === 'string' ? eval(onReady) : onReady(); //< Do what it's supposed to do once the condition is fulfilled
                        clearInterval(interval); //< Stop this interval
                    }
                }
            }, 100); //< repeat check every 100ms
    };

    function isoDateString(d) {
        function pad(n) {
            return n < 10 ? '0' + n : n;
        }

        return d.getUTCFullYear() + '-'
            + pad(d.getUTCMonth() + 1) + '-'
            + pad(d.getUTCDate()) + 'T'
            + pad(d.getUTCHours()) + ':'
            + pad(d.getUTCMinutes()) + ':'
            + pad(d.getUTCSeconds()) + 'Z';
    };

	function generateErrorXml(err, tests) {
		console.log("generateErrorXml - ", err, " : ", tests);
        var testName = 'Timeout',
			moduleName = 'Jasmine',
			timestamp = isoDateString(new Date()),
			resultStr = '<testsuite name="' + tests + '" timestamp="' + timestamp + '" tests="1" failures="1">' +
                        '<testcase name="' + testName + '" classname="' + moduleName + '">' +
                        '<failure message="' + moduleName + '" type="' + moduleName + '">' +
						err +
                        '</failure>' +
                        '</testcase>' +
                        '</testsuite>';
        return resultStr;
    };

    function generateTestResultXml(finalResult, tests) {
        var timestamp = isoDateString(new Date());
        var results = finalResult.results;
   
        for (var i = 0, len = results.length; i < len; i++) {
            var result = results[i];
            var specs = result.specs;
            var resultStr = '<testsuite name="' + result.suiteName + '" timestamp="' + timestamp + '" tests="' + result.specs.length + '" failures="'
                    + result.failedTotal + '">';
                    
            for (var j = 0, l = specs.length; j < l; j++) {
                var sp = specs[j];
                resultStr += '<testcase name="' + sp.specName + '" classname="' + result.suiteName + '">';

                if (sp.failedMsg) {
                    resultStr += '<failure message="' + sp.failedMsg + '" type="' + result.suiteName + '">';
                    resultStr += '<failedTrace>' + sp.failedTrace + '</failedTrace>';
                    resultStr += '</failure>';
                }

                resultStr += '</testcase>';
            }
            resultStr += '</testsuite>';
        }
	    
        return resultStr;
    };

    var JasmineRunner = function (args) {
        var numArgs = args.length;
        console.log("Args: " + numArgs);
        // Make sure this is valid
        if (numArgs <= 1) {
            console.log('Usage: JasmineRunner.js --tests=URL --baseurl=baseurl [--outputfilename=<jasmine>] [--timeout=<10000>]');
            phantom.exit(1);
        }

        // Set the properties
        var opts = {
            'tests': '',
            'outputfilename': 'test.xml',
            'timeout': 10000
        };

        for (var i = 0; i < numArgs; i++) {
            if (args[i].indexOf("--") === 0) {
                var lcarg = args[i].toLowerCase();

                // setting the test file
                if (lcarg.indexOf('--tests=') >= 0) {
                    opts.tests = lcarg.replace('--tests=', '');
                }

                // setting the output filename
                else if (lcarg.indexOf('--outputfilename=') >= 0) {
                    opts.outputfilename = lcarg.replace('--outputfilename=', '');
                }

                // setting the output filename
                else if (lcarg.indexOf('--baseurl=') >= 0) {
                    opts.baseurl = lcarg.replace('--baseurl=', '');
                }
                // setting the timeout value
                else if (lcarg.indexOf('--timeout') >= 0) {
                    opts.timeout = lcarg.replace('--timeout=', '');
                }
            }
        }

        this.options = opts;

        if (!this.options.tests) {
            console.log('Must specify tests');
            phantom.exit(1);
        }
        
        console.log("Tests: " + this.options.tests);
        console.log("OutputFileName: " + this.options.outputfilename);
        console.log("Timeout: " + this.options.timeout);
        
        // Now let's get a file system handle.
        this.fs = require("fs");

    };

	JasmineRunner.prototype.run = function () {

		var url = this.options.baseurl + this.options.tests,
			page = require('webpage').create(),
			outputfilename = this.options.outputfilename,
			tests = this.options.tests,
			fs = this.fs,
			xmlStart = '<?xml version="1.0" encoding="utf-8" ?>' + '<testsuites name="testsuites">',
			xmlEnd = '</testsuites>',
			errorXml,
		
			// Function to test for the end of the spec run
			testFn = function () {
				return page.evaluate(function () {
					var runner1 = document.body.querySelector('.runner');
					if(!runner1) {
						return !!runner1;
					}
					return !!runner1.querySelector('.description');
				});
			},

			// Function to record a timeout error
			onError = function () {
				console.log("onError");
				errorXml = generateErrorXml('Timeout occurred', tests);
				fs.write(outputfilename, errorXml, "a");
				fs.write(outputfilename, xmlEnd, "a");
				phantom.exit(1);
			},

			// Function to run when the specs are completed
			onReady = function () {
				console.log("ready");
				console.log("OutputFilename: " + outputfilename);
				var finalResult = page.evaluate(function () {
					var suites = document.body.querySelectorAll('.suite');
					console.log("# of suites: " + suites.length);
					var results = [];
					var total = 0;
					for(var i = 0; i < suites.length; i++) {
						var result = { };
						var suite = suites[i];

						var suiteName = suite.querySelector('.description').innerText;
					
						result.suiteName = suiteName;

						console.log('--------------------------------------------------------');
						var resultSpecs = [];
						var specs = suite.querySelectorAll('.spec');
						var failed = 0;
						for(var j = 0; j < specs.length; j++) {
							var detail = { };
							var spec = specs[j];
							var passed = spec.className.indexOf('passed') != -1;
							var skipped = spec.className.indexOf('skipped') != -1;
						
							detail.specName = spec.querySelector('.description').innerText;

							if(!passed && !skipped) {
								failed += 1;
								detail.failedMsg = spec.querySelector('.resultMessage.fail').innerText;
								var trace = spec.querySelector('.stackTrace');
								detail.failedTrace = trace != null ? trace.innerText : 'not supported by phantomJS yet';
							}

							resultSpecs.push(detail);
						}

						result.specs = resultSpecs;
						result.failedTotal = failed;

						results.push(result);
						total += resultSpecs.length;
						
					}

					var runner1 = document.body.querySelector('.runner');
					//console.log('--------------------------------------------------------');
					var summary = runner1.querySelector('.description').innerText;
					console.log('Finished: ' + summary);

					return {
						results: results,
						summary: summary
						// totalFailed: failed,
						// specsTotal: total
					};
				});

				var resultXml = generateTestResultXml(finalResult, tests);
				fs.write(outputfilename, resultXml, "a");
				fs.write(outputfilename, xmlEnd, "a");
				phantom.exit(finalResult.totalFailed);
			};

		// Write the start of the file
		fs.write(outputfilename, xmlStart, "w");

		if(!page) {
			errorXml = generateErrorXml('Could not create WebPage', tests);
			fs.write(outputfilename, errorXml, "a");
			fs.write(outputfilename, xmlEnd, "a");
			phantom.exit(1);
		}

		page.onConsoleMessage = function (msg) {
			console.log(msg);
		};

		var timeout = this.options.timeout;
		page.open(url, function (status) {
			
			console.log('page.open: ' + status);
			if(status !== "success") {
				console.log("Unable to access network");
				errorXml = generateErrorXml('Could not access network', tests);
				fs.write(outputfilename, errorXml, "a");
				fs.write(outputfilename, xmlEnd, "a");
				phantom.exit(1);
				return;
			}

			poll(testFn, onReady, onError, timeout);
			
		});

	};
	
	// Run it
	var args = require('system').args;
    var runner = new JasmineRunner(args);
    runner.run();
    
})();

