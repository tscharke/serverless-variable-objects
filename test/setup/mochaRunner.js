'use strict';

var args = process.argv || [];
var Mocha = require('mocha');
var glob = require('glob');
var istanbul = require('istanbul');
let rmrf = require('rimraf');


/**
 * Specify files needed for testing
 */
var files = glob.sync('./test/test-suite/**/*.js');

var testOuputFolder = './test/test-results/';
process.env.TESTING = true;

rmrf.sync(testOuputFolder);

/**
 * Set up an environment variables we need for testing
 */

/**
 * Set up the mocha options we want, like don't quit if a test fails
 * @type {{bail: boolean}}
 */
var mochaConfig = {
  bail: false
};

/**
 * Add junit reporting
 */
if (args.indexOf('junit') >= 0) {
  mochaConfig.reporter = 'mocha-junit-reporter';
  mochaConfig.reporterOptions = {
    mochaFile: `${testOuputFolder}test-result.xml`
  }
}

/**
 * Add coverage reports when testing.
 */
if (args.indexOf('coverage') >= 0) {

  var instrumenter = new istanbul.Instrumenter();
  var collector = new istanbul.Collector();

  var coberturaReport = istanbul.Report.create('cobertura', {dir: `${testOuputFolder}coverage/`});
  var htmlReport = istanbul.Report.create('html', {dir: `${testOuputFolder}coverage/html/`});


  istanbul.matcherFor({includes: ['index.js']}, (error, matcher) => {
    istanbul.hook.hookRequire(matcher, instrumenter.instrumentSync.bind(instrumenter));

    startMocha(function (results) {

      collector.add(__coverage__);

      htmlReport.on('done', function() {
        process.exit(results)
      });

      coberturaReport.on('done', function() {
        htmlReport.writeReport(collector)
      });

      coberturaReport.writeReport(collector);
    });
  });

} else {
  startMocha();
}


function startMocha(fn) {
  fn = fn || process.exit;
  var mocha = new Mocha(mochaConfig);

  files.forEach(file => mocha.addFile(file));

  mocha.run(fn);
}