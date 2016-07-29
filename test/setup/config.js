'use strict';

const path = require('path');

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

chai.config.includeStack = true;

global.expect = chai.expect;
global.AssertionError = chai.AssertionError;
global.Assertion = chai.Assertion;
global.assert = chai.assert;
global.should = chai.should();

// Require ENV lets, can also set ENV lets in your IDE
require('dotenv').config({ path: path.join(__dirname, '.env'), silent: true });

let config = {
  region:               'us-west-2',
  stage:                'dev'
};

module.exports = config;