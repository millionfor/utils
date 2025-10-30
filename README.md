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
const [error] = await tryToCatch(writeJSON.default, 'data.json', { hello: 'world' })

if (error) console.error(error.message)

const options = {
  replacer: ['hello'], // properties to put in json
  space: 4, // default space count
  eof: true, // default new line at end of file
  encoding: 'utf8', // default
  mode: '0o666', // default
  flag: 'w' // default
}

await writeJSON.default('data.json', { hello: 'world' }, options)
```

##### writeJSON.sync(name, object[, options])

Synchonouse write stringified object.

```js
try {
  writeJSON.sync('data.json', { hello: 'world' })
} catch (error) {
  console.log(error.message)
}
```

##### writeJSON.syncTry(name, object[, options])

Synchonouse try to write stringified object.

```js
writeJSON.syncTry('data.json', { hello: 'world' })
```

### 2. rm

##### delete directory recursively

```js
rmDirFile('./data.json')
```

### 3. writeText

##### Write file text content

```js
writeText('./data.md', 'my test')
```

```ts
import writeJSON, { sync, syncTry } from './writeJSON'
declare const _default: {
  writeJSON: {
    default: typeof writeJSON
    sync: typeof sync
    syncTry: typeof syncTry
  }
  rmDirFile: (path: string) => Promise<void>
  writeText: (filePath: string, content: string) => Promise<any>
}
export default _default
```

## Logger (QLogger)

QLogger 提供 Node 环境下的彩色控制台输出、文件写入与历史清理，并支持与外部 winston 实例融合（含 `winston-daily-rotate-file`）。可直接在 Node.js、NestJS、Koa2 等项目中调用。

### 1. Node.js 用法

```ts
import { QLogger } from '@millionfor/utils'

const logger = QLogger.getLogger('MyApp', {
  logDir: './logs',
  levelType: 'info',
  validityDays: 7,
})

logger.info('service started')
logger.error('something wrong')
```

### 2. 与 winston 融合（多进程日志/归档/统一支持）

库不强依赖 winston，可选择在外部初始化 winston 实例，利用 QLogger 路由日志：

```ts
import { createLogger, format, transports } from 'winston'
import 'winston-daily-rotate-file'
import { QLogger } from '@millionfor/utils'

const winstonLogger = createLogger({
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.DailyRotateFile({
      dirname: './.cache',
      filename: 'application-%DATE%.info.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '7d',
      level: 'info',
    }),
    new transports.DailyRotateFile({
      dirname: './.cache',
      filename: 'application-%DATE%.error.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error',
    }),
  ],
})

const qlogger = QLogger.getLogger('MyApp')
qlogger.setWinstonLogger(winstonLogger)

qlogger.info('hello with winston')
```

可选：自定义级别映射

```ts
qlogger.setWinstonLogger(winstonLogger, { info: 'info', error: 'error' })
```

### 3. NestJS 集成

```ts
// logger.service.ts
import { Injectable } from '@nestjs/common'
import { createLogger, format, transports } from 'winston'
import 'winston-daily-rotate-file'
import { QLogger } from '@millionfor/utils'

@Injectable()
export class LoggerService {
  private readonly logger = QLogger.getLogger('NestApp', { levelType: 'debug' })

  constructor () {
    const winstonLogger = createLogger({
      format: format.combine(format.timestamp(), format.json()),
      transports: [new transports.Console()],
    })
    this.logger.setWinstonLogger(winstonLogger)
  }

  log (...args: any[]) { this.logger.log(...args) }
  info (...args: any[]) { this.logger.info(...args) }
  warn (...args: any[]) { this.logger.warn(...args) }
  error (...args: any[]) { this.logger.error(...args) }
  debug (...args: any[]) { this.logger.debug(...args) }
}
```

### 4. Koa2 日志中间件

```ts
import Koa from 'koa'
import { QLogger } from '@millionfor/utils'

const logger = QLogger.getLogger('KoaApp', { logDir: './logs', levelType: 'info' })

export async function loggerMiddleware (ctx, next) {
  const start = Date.now()
  await next()
  const ms = Date.now() - start
  logger.info(`${ctx.method} ${ctx.url} - ${ms}ms`)
}

const app = new Koa()
app.use(loggerMiddleware)
```

### 配置属性

```ts
interface LoggerOptions {
  logDir?: string
  validityDays?: number
  silent?: boolean
  debug?: boolean
  levelType?: 'error'|'warn'|'info'|'log'|'debug'|'trace'
  color?: Record<string, any>
  timeFormat?: string
}

// 扩展（仅 QLogger 可用）
interface QLoggerOptions extends LoggerOptions {
  winstonLogger?: any
  winstonLevelMap?: Partial<Record<string, string>>
}
```

## License

MIT
