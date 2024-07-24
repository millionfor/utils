# @millionfor/utils

A Typescript based Node Development Tool Library.

## Installation

```bash
$ npm i @millionfor/utils
```

## Usage

```js
const tryToCatch = require('try-catch')
const utils = require('@millionfor/utils')

const { writeJSON, rmDirFile } = utils
```



## APIs

### 1. writeJSON

##### writeJSON.default(name, object[, options], callback)

Asynchonouse write stringified object.

```js
const [error] = await tryToCatch(writeJSON.default, 'data.json', {hello: 'world'});

if (error)
    console.error(error.message);

const options = {
    replacer: ['hello'],    // properties to put in json
    space: 4,               // default space count
    eof: true,              // default new line at end of file
    encoding: 'utf8',       // default
    mode: '0o666',          // default
    flag: 'w',              // default
};

await writeJSON.default('data.json', {hello: 'world'}, options);
```

##### writeJSON.sync(name, object[, options])

Synchonouse write stringified object.

```js
try {
    writeJSON.sync('data.json', {hello: 'world'});
} catch(error) {
    console.log(error.message);
}
```

##### writeJSON.syncTry(name, object[, options])

Synchonouse try to write stringified object.

```js
writeJSON.syncTry('data.json', {hello: 'world'});
```

### 2. rm

##### delete directory recursively

```js
rmDirFile('./data.json')
```



```ts
import writeJSON, { sync, syncTry } from './writeJSON';
declare const _default: {
    writeJSON: {
        default: typeof writeJSON;
        sync: typeof sync;
        syncTry: typeof syncTry;
    };
    rmDirFile: (path: string) => Promise<void>;
};
export default _default;
```

## License

MIT
