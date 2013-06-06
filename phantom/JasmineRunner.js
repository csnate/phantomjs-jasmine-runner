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
        var timestamp = isoDateString(new Date()),
        	results = finalResult.results,
   			resultStr = '',
   			i = 0; l = results.length;
   			
        for (; i < l; i++) {
            var result = results[i],
            	specs = result.specs;
            	j = 0, k = specs.length;
            	
            resultStr += '<testsuite name="' + result.suiteName + '" timestamp="' + timestamp + '" tests="' + result.specs.length + '" failures="'
                    + result.failedTotal + '">';
                    
            for (; j < k; j++) {
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
					var suites = document.body.querySelectorAll('.suite'),
						results = [],
						totalFailed = 0,
						i = 0, l = suites.length;
					console.log("# of suites: " + suites.length);

					for(; i < l; i++) {
						var result = { },
							suite = suites[i],
							suiteName = suite.querySelector('.description').innerText,
							resultSpecs = [],
							specs = suite.querySelectorAll('.spec'),
							failed = 0,
							j = 0; k = specs.length;
					
						result.suiteName = suiteName;

						console.log('--------------------------------------------------------');
						
						for(; j < k; j++) {
							var detail = { },
								spec = specs[j],
								passed = spec.className.indexOf('passed') != -1,
								skipped = spec.className.indexOf('skipped') != -1;
						
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
						totalFailed += failed;

						results.push(result);
						
					}

					var runner1 = document.body.querySelector('.runner'),
						summary = runner1.querySelector('.description').innerText;
					console.log('Finished: ' + summary);

					return {
						results: results,
						summary: summary,
						totalFailed: totalFailed
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
	var args = require('system').args,
    	runner = new JasmineRunner(args);
    runner.run();
    
})();

