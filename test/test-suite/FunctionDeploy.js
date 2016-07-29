'use strict';

/**
 * Test: Function Deploy Action
 */

let Serverless = require('serverless/lib/Serverless.js');
let path = require('path');
let testUtils = require('../setup/test_utils');
let config = require('../setup/config');
let fs = require('fs');
let _ = require('lodash');

let S;
let tmpProjectPath;


let cv = {
  objKey: {
    cvKey: 'cvKey',
    stage: {
      svKey: 'cvKey',
      region: {
        rvKey: 'cvKey'
      }
    }
  },
  arrayKey: [1, 2, 3, 4, {hello: 'world'}]
};

let sv = {
  objKey: {
    stage: {
      svKey: 'svKey'
    }
  }
};

let rv = {
  objKey: {
    stage: {
      region: {
        rvKey: 'rvKey'
      }
    }
  }
};

let mergedVariables = _.merge({}, cv, sv, rv);

/**
 * Create Test Project
 */

describe('Serverless Variable Objects', function () {
  let name = 'function0';
  let options = {
    stage: config.stage,
    region: config.region,
    names: [name],
    name
  };

  before(function (done) {
    this.timeout(0);

    testUtils.createTestProject(path.join(__dirname, '../test-prj'), config, ['functions'])
      .then(projectPath => {
        tmpProjectPath = projectPath;
        process.chdir(projectPath);

        S = new Serverless({
          projectPath,
          interactive: false,
          awsAdminKeyId: config.awsAdminKeyId,
          awsAdminSecretKey: config.awsAdminSecretKey
        });

        return S.init().then(() => {

          let origHandler = S.classes.RuntimeNode.prototype._addEnvVarsInline;

          function validatehandler(func, pathDist, stage, region) {
            let handlerDir = path.dirname(func.handler);
            return origHandler.call(this, func, pathDist, stage, region)
              .then(res => {
                let filePath = path.join(pathDist, handlerDir, '_serverless_handler.js');
                require(filePath);
                return res;
              });
          }

          S.classes.RuntimeNode.prototype._addEnvVarsInline = validatehandler;

          let project = S.getProject();
          let stage = project.getStage(config.stage);
          let region = stage.getRegion(config.region);
          _.merge(project.getVariables(), cv);
          _.merge(stage.getVariables(), sv);
          _.merge(region.getVariables(), rv);

          let keys = Object.keys(mergedVariables);
          keys.forEach(key => project.functions.function0.environment[key] = `\${${key}}`);

          done();
        });
      });
  });

  after(function (done) {
    done();
  });


  /**
   * Tests
   */

  describe("Without Plugin", function () {


    function createTests() {
      let keys = Object.keys(mergedVariables);
      keys.forEach(key => {
        it(`Should have added ${key} to process.env with .toString()`, function () {
          process.env.should.include.keys(key);
          process.env[key].should.be.a('string');
          process.env[key].should.eql(mergedVariables[key].toString());
        })
      });
    }

    describe('Function Deploy', function () {
      let origEnv = process.env;

      before(function (done) {
        this.timeout(0);

        S.actions.functionDeploy(options)
          .then(evt => undefined)
          .catch(e => undefined)
          .finally(() => {
            done();
          });
      });

      after(function (done) {
        process.env = origEnv;
        done();
      });

      createTests();
    });


    describe('Function Run', function () {
      let origEnv = process.env;

      before(function (done) {
        this.timeout(0);

        S.actions.functionRun(options)
          .then(evt => undefined)
          .catch(e => undefined)
          .finally(() => {
            done();
          });
      });

      after(function (done) {
        process.env = origEnv;
        done();
      });

      createTests();
    });
  });

  describe('With Plugin', function () {

    before(function(done) {
      S._loadPlugins(path.join(__dirname, '../../'), ['index.js']);
      done();
    });

    function createTests() {
      let keys = Object.keys(mergedVariables);
      keys.forEach(key => {
        it(`Should have added ${key} to process.env with JSON.stringify()`, function () {
          process.env.should.include.keys(key);
          process.env[key].should.be.a('string');
          process.env[key].should.eql(JSON.stringify(mergedVariables[key]));
          let parsed = JSON.parse(process.env[key]);
          parsed.should.eql(mergedVariables[key]);
        })
      });
    }

    describe('Function Deploy', function () {

      let origEnv = process.env;

      before(function (done) {
        this.timeout(0);

        S.actions.functionDeploy(options)
          .then(evt => undefined)
          .catch(e => undefined)
          .finally(() => {
            done();
          });
      });

      after(function (done) {
        process.env = origEnv;
        done();
      });

      createTests();

    });


    /**
     * Tests
     */

    describe('Function Run', function () {

      let origEnv = process.env;

      before(function (done) {
        this.timeout(0);

        S.actions.functionRun(options)
          .then(evt => undefined)
          .catch(e => undefined)
          .finally(() => {
            done();
          });
      });

      after(function (done) {
        process.env = origEnv;
        done();
      });

      createTests();

    });

  });
});