A Jasmine runner using PhantomJS
================================
This repo will be used in a future talk about how to integrate [Jasmine] (http://pivotal.github.io/jasmine/) unit tests into a [Jenkins] (http://jenkins-ci.org/) build using [PhantomJS] (http://phantomjs.org/).

Prerequisites 
-----
* You are using a [Jenkins] (http://jenkins-ci.org/) CI server
* [PhantomJS] (http://phantomjs.org/) is installed on the build server and added to the PATH
* The JasmineRunner is developed for use with the TrivialReporter and NOT the HtmlReporter.
* For this example, I am using [NAnt] (http://nant.sourceforge.net/) for my build script, but that is not required.  You can just as easily use a batch command build step instead.

Jenkins Configuration
---------------------
**Source Code Management -> Git -> Advanced**

* Local subdirectory for repo (optional) = src.

*This is done to keep your source code and test results completely separate.  The test results will be saved to a "tests\jasmine" directory in your workspace root. If you change this to a different value, you'll need to update the default.build file as well.  Unfortunately, this value isn't passed to the build script as an environment variable.*

**Add a build step -> Execute NAnt build**

* NAnt Build File = src/build/default.build
* Targets = jasmineunittest

**Add a Post-build Action -> Publish JUnit test result report**

* Test report XMLs = tests/jasmine/*.xml