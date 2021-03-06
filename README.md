# Serverless Variable Objects

> **Note**: This is a fork from @VivintSolar 's [serverless-variable-objects](https://github.com/VivintSolar/serverless-variable-objects) to support the latest version of the [serverless](https://github.com/serverless/serverless)-framework. Means: It requires serverless in version >= 1.4.1 **only**!
> As mentioned [here](https://github.com/VivintSolar/serverless-variable-objects/issues/7#issuecomment-486311806) this is only a raw and naive implementation without updated tests or other stuff.

Serverless allows adding variables to the runtime by placing them in process.env. This is great as long as the variables are only strings or integers.

As per https://nodejs.org/api/process.html#process_process_env:

> Assigning a property on `process.env` will implicitly convert the value to a string.

Thus turning objects into `[Object object]`, and arrays into `1,2,3`.

Serverless Variable Objects uses JSON.stringify() to convert objects and arrays into strings before they are added to process.env.

### Setup

- Install the plugin in the root of your Serverless Project:

```
npm install https://github.com/tscharke/serverless-variable-objects --save-dev
```

- Add the plugin to the `plugins` array in your Serverless Project's `s-project.json`, like this:

```
plugins: [
    "serverless-variable-objects"
]
```

Now you can have a variables file like so:

```
{
  ...,
  "myObject": {
    "key1": "value1",
    "nestedObject": {
      "nestedKey1": "nestedKey1"
    }
  }
}
```

Then in your s-function.json file, add them to the environment section

```
{
  ...,
  "environment": {
    ...,
    "MY_OBJECT": "${myObject}"
  }
}
```

Finally inside your function:

```
let myObject = JSON.parse(process.env.MY_OBJECT);
```

Serverless uses lodash.merge() to combine the common variables with the stage and region variables. Thus allowing for defaults to be set in s-variables-common.json, and then changing some or all of those values at the stage, then region level.
