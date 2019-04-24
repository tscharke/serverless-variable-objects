"use strict";

const BbPromise = require("bluebird");
const _ = require("lodash");

class ConvertEnvironmentVariables {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.commands = {
      "variable-objects": {
        usage: "Serverless-Plugin to turning objects into arrays",
        lifecycleEvents: ["collect", "resolve", "apply"]
      }
    };

    this.isOfflineHooked = false;
    this.hooks = {
      "before:offline:start:init": this.initOfflineHook.bind(this),
      "before:offline:start": this.initOfflineHook.bind(this),
      "before:invoke:local:invoke": this.initOfflineHook.bind(this),
      "variable-objects:collect": this.collectEnvVars.bind(this),
      "variable-objects:resolve": this.resolveEnvVars.bind(this),
      "variable-objects:apply": this.applyEnvVars.bind(this)
    };

    this.environmentVariables = {};
  }

  initOfflineHook() {
    if (!this.isOfflineHooked) {
      this.isOfflineHooked = true;
      return this.serverless.pluginManager.run(["variable-objects"]);
    }

    return BbPromise.resolve();
  }

  collectEnvVars() {
    return BbPromise.try(() => {
      const envVars = {};

      _.assign(envVars,this.serverless.service.provider.environment);

      this.environmentVariables = envVars;

      return BbPromise.resolve();
    });
  }

  __convertVariables() {
    const variables = {};
    _.assign(variables, this.environmentVariables);

    const keys = Object.getOwnPropertyNames(variables);
    keys.forEach(key => {
      let value = variables[key];
      if (typeof value == typeof {} || Array.isArray(value)) {
        variables[key] = JSON.stringify(value);
      }
    });
    return variables;
  }

  resolveEnvVars() {
    return BbPromise.try(() => {
      return BbPromise.resolve(this.__convertVariables());
    });
  }

  applyEnvVars() {
    return BbPromise.try(() => {
      if (this.isOfflineHooked) {
        _.assign(
          this.serverless.service.provider.environment,
          this.__convertVariables()
        );
      }
    });
  }
}

module.exports = ConvertEnvironmentVariables;
