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

### 快速开始

#### 1. 基础用法（不使用 winston）

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

#### 2. 启用 winston 文件轮转（推荐）

只需一行配置即可启用 winston 文件轮转功能：

```ts
import { QLogger } from '@millionfor/utils'

const logger = QLogger.getLogger('MyApp', {
  logDir: './logs',
  levelType: 'info',
  enableWinston: true, // 自动配置文件轮转
})

logger.info('service started') // 输出到控制台和文件
logger.error('something wrong') // 错误日志会单独保存
```

**注意**：使用 `enableWinston: true` 需要先安装 winston：

```bash
npm install winston winston-daily-rotate-file
```

### NestJS 集成

```ts
// logger.service.ts
import { Injectable } from '@nestjs/common'
import { QLogger } from '@millionfor/utils'

@Injectable()
export class LoggerService {
  private readonly logger = QLogger.getLogger('NestApp', {
    logDir: './logs',
    levelType: 'info',
    enableWinston: true, // 启用内置 winston 集成
  })

  log(...args: any[]) { this.logger.log(...args) }
  info(...args: any[]) { this.logger.info(...args) }
  warn(...args: any[]) { this.logger.warn(...args) }
  error(...args: any[]) { this.logger.error(...args) }
  debug(...args: any[]) { this.logger.debug(...args) }
}
```

### Koa2 日志中间件

```ts
import Koa from 'koa'
import { QLogger } from '@millionfor/utils'

const logger = QLogger.getLogger('KoaApp', {
  logDir: './logs',
  levelType: 'info',
  enableWinston: true, // 自动配置文件轮转
})

export async function loggerMiddleware(ctx: Koa.Context, next: Koa.Next) {
  const start = Date.now()
  await next()
  const ms = Date.now() - start
  logger.info(`${ctx.method} ${ctx.url} - ${ms}ms`)
}

const app = new Koa()
app.use(loggerMiddleware)
```

### 高级配置

#### 自定义 winston 选项

```ts
import { QLogger } from '@millionfor/utils'

const logger = QLogger.getLogger('MyApp', {
  logDir: './logs',
  levelType: 'info',
  enableWinston: true,
  winstonOptions: {
    enableConsole: true,        // 启用控制台输出（默认: true）
    consoleFormat: 'colorize',  // 控制台格式: 'json' | 'simple' | 'colorize'（默认: 'simple'）
    enableFileRotate: true,     // 启用文件轮转（默认: true）
    separateErrorLog: true,     // 单独输出错误日志（默认: true）
    jsonFormat: true,           // 文件使用 JSON 格式（默认: true）
    timestampFormat: 'YYYY-MM-DD HH:mm:ss',
    fileRotateOptions: {
      dirname: './logs',
      filename: 'app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,      // 压缩归档（默认: true）
      maxSize: '20m',           // 单个文件最大大小（默认: '20m'）
      maxFiles: '7d',           // 保留天数（默认: '7d'）
    },
    errorLogMaxFiles: '14d',    // 错误日志保留天数（默认: '14d'）
  },
})
```

#### 手动配置 winston（高级用法）

如果需要完全自定义 winston 配置：

```ts
import { createLogger, format, transports } from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import { QLogger } from '@millionfor/utils'

const winstonLogger = createLogger({
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new DailyRotateFile({
      dirname: './logs',
      filename: 'application-%DATE%.info.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '7d',
      level: 'info',
    }),
    new DailyRotateFile({
      dirname: './logs',
      filename: 'application-%DATE%.error.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error',
    }),
  ],
})

const logger = QLogger.getLogger('MyApp', {
  winstonLogger, // 手动绑定 winston logger
})

logger.info('hello with winston')
```

可选：自定义级别映射

```ts
logger.setWinstonLogger(winstonLogger, { 
  log: 'info',  // 将 'log' 级别映射到 'info'
  info: 'info', 
  error: 'error' 
})
```

### 配置属性

#### LoggerOptions

```ts
interface LoggerOptions {
  logDir?: string                    // 日志保存的目录位置，默认为空则不保存至文件
  validityDays?: number              // 历史日志文件有效天数，默认为 7 天。设置为 0 则不自动清理
  silent?: boolean                   // 是否为静默模式，为 true 则不打印至控制台
  debug?: boolean                    // 是否为调试模式，为 true 控制台打印为对象格式的日志
  levelType?: 'error'|'warn'|'info'|'log'|'debug'|'trace'  // 日志级别，默认: 'log'
  color?: Record<string, any>        // 通过外部注入 color 能力
  timeFormat?: string                // 日志时间格式，默认为: 'yyyy-MM-dd hh:mm:ss.S'
}
```

#### QLoggerOptions

```ts
interface QLoggerOptions extends LoggerOptions {
  // 若提供，则由外部 winston 实例负责写入与转储（本类将静默控制台输出）
  winstonLogger?: any
  
  // 映射内部日志级别到 winston 级别名，未提供则同名
  winstonLevelMap?: Partial<Record<'error'|'warn'|'info'|'log'|'debug'|'trace', string>>
  
  // 是否启用内置 winston 集成（自动创建 winston logger 并绑定），默认为 false
  enableWinston?: boolean
  
  // Winston 配置选项，仅在 enableWinston 为 true 时生效
  winstonOptions?: WinstonOptions
}
```

#### WinstonOptions

```ts
interface WinstonOptions {
  enableConsole?: boolean           // 是否启用控制台输出，默认: true
  consoleFormat?: 'json' | 'simple' | 'colorize'  // 控制台格式，默认: 'simple'
  enableFileRotate?: boolean        // 是否启用文件轮转，默认: true
  separateErrorLog?: boolean        // 是否单独输出错误日志，默认: true
  jsonFormat?: boolean              // 是否使用 JSON 格式，默认: true
  timestampFormat?: string          // 时间戳格式，默认: 'YYYY-MM-DD HH:mm:ss'
  errorLogMaxFiles?: string | number // 错误日志保留天数，默认: '14d'
  fileRotateOptions?: WinstonFileRotateOptions
}
```

#### WinstonFileRotateOptions

```ts
interface WinstonFileRotateOptions {
  dirname?: string      // 日志目录，默认: logDir 或 './logs'
  filename?: string     // 日志文件名模板，支持 %DATE% 占位符，默认: 'tag-%DATE%.log'
  datePattern?: string  // 日期格式，默认: 'YYYY-MM-DD'
  zippedArchive?: boolean  // 是否压缩归档，默认: true
  maxSize?: string      // 单个文件最大大小，默认: '20m'
  maxFiles?: string | number  // 保留天数或数量，默认: '7d'
}
```

### 常见问题

#### 1. 日志没有输出？

- 检查 `levelType` 设置，确保日志级别足够低（如 `'debug'` 或 `'trace'`）
- 确认 winston 已安装：`npm install winston winston-daily-rotate-file`
- 检查日志文件是否生成在 `logDir` 目录下

#### 2. winston 未安装时的行为

如果未安装 winston 但设置了 `enableWinston: true`，QLogger 会：
- 输出警告信息提示安装 winston
- 自动降级到原有的文件写入方式
- 日志仍能正常输出，只是不进行文件轮转

#### 3. 日志级别映射

QLogger 的 `log` 级别在 winston 中会自动映射到 `info` 级别，因为 winston 不直接支持 `log` 级别。

#### 4. 文件轮转

启用 `enableWinston: true` 后：
- 日志文件按日期自动轮转（格式：`app-2024-01-01.log`）
- 达到 `maxSize` 时会自动创建新文件
- 超过 `maxFiles` 的旧日志会自动删除
- 归档文件默认会被压缩（`.gz`）

#### 5. 错误日志分离

默认情况下，错误日志会单独保存在 `*.error.log` 文件中，并保留更长时间（默认 14 天）。

## License

MIT
