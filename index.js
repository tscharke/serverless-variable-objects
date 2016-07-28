'use strict';

let Promise = require('bluebird');

module.exports = function convertVariables(S) {

  let origGetEnvVars = S.classes.Runtime.prototype.getEnvVars;

  S.classes.Runtime.prototype.getEnvVars = (func, stage, region) =>
    Promise.resolve(origGetEnvVars(func, stage, region))
    .then(stringifyVars);

  function stringifyVars(variables) {
    let keys = Object.getOwnPropertyNames(variables);

    keys.forEach(key => {
      let value = variables[key];
      if (typeof value == typeof {} || Array.isArray(value)) {
        variables[key] = JSON.stringify(value);
      }
    });
    return variables;
  }
};
