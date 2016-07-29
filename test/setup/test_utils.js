'use strict';

let fs = require('fs');
let fse = require('fs-extra');
let os = require('os');
let path = require('path');
let rimraf = require('rimraf');
let Promise = require('bluebird');
let uuid = require('node-uuid');
let SUtils = require('serverless/lib/utils/index');

/**
 * Create test private
 * @param projectDir the directory of the test project
 * @param config see tests/config.js
 * @param npmInstallDirs list of dirs relative to private root to execute npm install on
 * @returns {Promise} full path to proj temp dir that was just created
 */

module.exports.createTestProject = function (projectDir, config, npmInstallDirs) {

  let projectName = 's-test-prj';
  let projectStage = config.stage;
  let projectRegion = config.region;
  let projectLambdaIAMRole = config.iamRoleArnLambda;
  let projectBucket = 'serverless.' + projectRegion + '.' + projectName + '.com';

  // Create Test Project
  let tmpProjectPath = path.join(os.tmpdir(), projectName);

  SUtils.sDebug('test_utils', 'Creating test project in ' + tmpProjectPath + '\n');

  // Delete test folder if already exists
  if (fs.existsSync(tmpProjectPath)) {
    rimraf.sync(tmpProjectPath);
  }

  // Copy test private to temp directory
  fs.mkdirSync(tmpProjectPath);
  fse.copySync(projectDir, tmpProjectPath, {
    clobber: true
  });

  let projectJSON = SUtils.readFileSync(path.join(tmpProjectPath, 's-project.json'));
  projectJSON.name = projectName;


  let commonVariablesPrivate = {
    project: projectName,
    projectBucket: projectBucket,
    projectBucketRegion: projectRegion,
    statusCode: "200"
  };

  let stageVariables = {
    stage: projectStage
  };

  let regionVariables = {
    region: projectRegion,
    resourcesStackName: `${projectName}-${projectStage}-r`,
    iamRoleArnLambda: projectLambdaIAMRole,
    testEventBucket: config.testEventBucket,
    streamArn: config.streamArn,
    'eventID:dynamodb': config.streamUUID,
    topicArn: config.topicArn
  };

  return Promise.all([
    SUtils.writeFile(path.join(tmpProjectPath, '_meta', 'resources', `s-resources-cf-${projectStage}-${projectRegion}.json`), JSON.stringify(projectJSON.cloudFormation, null, 2)),
    SUtils.writeFile(path.join(tmpProjectPath, '_meta', 'variables', 's-variables-common.json'), JSON.stringify(commonVariablesPrivate, null, 2)),
    SUtils.writeFile(path.join(tmpProjectPath, '_meta', 'variables', `s-variables-${projectStage}.json`), JSON.stringify(stageVariables, null, 2)),
    SUtils.writeFile(path.join(tmpProjectPath, '_meta', 'variables', `s-variables-${projectStage}-${projectRegion.replace(/-/g, '')}.json`), JSON.stringify(regionVariables, null, 2)),
    SUtils.writeFile(path.join(tmpProjectPath, `s-project.json`), JSON.stringify(projectJSON, null, 2))
  ])
    .then(function () {

      // Write Admin.env file
      let adminEnv = `AWS_DEV_PROFILE=default${os.EOL}`;
      fs.writeFileSync(path.join(tmpProjectPath, 'admin.env'), adminEnv, 'UTF8');

      //Need to run npm install on the test project, they recommend NOT doing this programatically
      //https://github.com/npm/npm#using-npm-programmatically
      if (npmInstallDirs) {
        npmInstallDirs.forEach(function (dir) {
          let fullPath = path.join(tmpProjectPath, dir);
          SUtils.sDebug('test_utils', `Running NPM install on ${fullPath}`);
          SUtils.npmInstall(fullPath);
        });
      }

      return tmpProjectPath;
    });
};