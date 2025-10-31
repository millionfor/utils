/* eslint no-console: 0 */
import { dirname, resolve } from 'node:path';
import type { WriteStream } from 'node:fs';
import { clearScreenDown, cursorTo } from 'node:readline';
import { color } from 'console-log-colors';
import { fs } from '../fs-system';
import { Logger, type LoggerOptions } from '../../common/libs/Logger';

const fsStreamCache: { [logPath: string]: WriteStream } = {};

/** Winston 文件轮转配置 */
export interface WinstonFileRotateOptions {
  /** 日志目录，默认为 logDir 或 './logs' */
  dirname?: string;
  /** 日志文件名模板，支持 %DATE% 占位符，默认为 'application-%DATE%.log' */
  filename?: string;
  /** 日期格式，默认为 'YYYY-MM-DD' */
  datePattern?: string;
  /** 是否压缩归档文件，默认为 true */
  zippedArchive?: boolean;
  /** 单个文件最大大小，默认为 '20m' */
  maxSize?: string;
  /** 保留天数或数量，默认为 '7d' */
  maxFiles?: string | number;
}

/** Winston 配置选项 */
export interface WinstonOptions {
  /** 是否启用控制台输出，默认为 true */
  enableConsole?: boolean;
  /** 控制台格式：'json' | 'simple' | 'colorize'，默认为 'simple' */
  consoleFormat?: 'json' | 'simple' | 'colorize';
  /** 是否启用文件轮转，默认为 true */
  enableFileRotate?: boolean;
  /** 文件轮转配置 */
  fileRotateOptions?: WinstonFileRotateOptions;
  /** 是否单独输出错误日志，默认为 true */
  separateErrorLog?: boolean;
  /** 错误日志保留天数，默认为 '14d' */
  errorLogMaxFiles?: string | number;
  /** 是否启用 JSON 格式输出，默认为 true */
  jsonFormat?: boolean;
  /** 时间戳格式，默认为 'YYYY-MM-DD HH:mm:ss' */
  timestampFormat?: string;
}

/** 用于 Node.js 中的 logger 模块 */
export interface QLoggerOptions extends LoggerOptions {
  /** 若提供，则由外部 winston 实例负责写入与转储（本类将静默控制台输出） */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  winstonLogger?: any;
  /** 映射内部日志级别到 winston 级别名，未提供则同名 */
  winstonLevelMap?: Partial<Record<keyof typeof import('../../common/libs/Logger').LogLevel, string>>;
  /** 是否启用内置 winston 集成（自动创建 winston logger 并绑定），默认为 false */
  enableWinston?: boolean;
  /** Winston 配置选项，仅在 enableWinston 为 true 时生效 */
  winstonOptions?: WinstonOptions;
}

export class QLogger extends Logger {
  public static map: { [tag: string]: QLogger } = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private winstonLogger?: any;
  private winstonLevelMap?: Record<string, string>;

  constructor(tag: string, options: LoggerOptions = {}) {
    if (!options.color) options.color = color;
    super(tag, options);

    const { winstonLogger, winstonLevelMap, enableWinston, winstonOptions } = options as QLoggerOptions;
    
    // 如果提供了 winstonLogger，直接使用
    if (winstonLogger) {
      this.setWinstonLogger(winstonLogger, winstonLevelMap);
    } 
    // 如果启用了内置 winston 集成，自动创建并绑定
    else if (enableWinston) {
      const loggerTag = tag.startsWith('[') ? tag.slice(1, -1) : tag;
      const createdWinstonLogger = QLogger.createWinstonLogger(loggerTag, winstonOptions || {}, options.logDir || './logs');
      if (createdWinstonLogger) {
        this.setWinstonLogger(createdWinstonLogger, winstonLevelMap);
      }
      // 如果 winston 未安装，降级使用原有的文件写入方式
    }
  }
  public override setLogDir(logDir: string) {
    if (!logDir || !fs?.createWriteStream) return;

    let logPath = logDir;

    if (logDir.endsWith('.log')) {
      logDir = dirname(logDir);
    } else {
      const curTime = new Date().toISOString().slice(0, 10).replace(/\D/g, '');
      logPath = resolve(logDir, `${this.tag.replace(/[^\dA-Za-z]/g, '')}_${curTime}.log`);
    }

    if (logPath === this.logPath) return;

    const logFsStream = fsStreamCache[this.logPath];
    if (logFsStream) {
      logFsStream.close();
      delete fsStreamCache[this.logPath];
    }

    this.logDir = logDir;
    this.logPath = logPath;

    try {
      if (this.logPath && !fs.existsSync(logPath)) this.cleanup(this.options.validityDays);
    } catch (error) {
      this.log((error as Error).message);
    }
  }
  /** 绑定外部 winston logger：绑定后将由 winston 承担输出与切割，当前实例默认静默控制台 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public setWinstonLogger(winstonLogger: any, levelMap?: Partial<Record<string, string>>) {
    this.winstonLogger = winstonLogger;
    this.winstonLevelMap = Object.create(null);
    if (levelMap) {
      for (const k in levelMap) this.winstonLevelMap[k] = String((levelMap as Record<string, string>)[k]);
    }
    // 由 winston 统一输出，当前 logger 静默控制台（仍可写文件若未提供 winston）
    this.updateOptions({ silent: true } as LoggerOptions);
  }
  /** 历史日志清理 */
  cleanup(validityDays?: number, logDir?: string): number {
    let count = 0;
    if (!logDir && this.options.logDir) logDir = this.options.logDir;
    if (logDir && logDir.endsWith('.log')) logDir = dirname(logDir);
    if (validityDays == null) validityDays = 7;
    if (validityDays < 1 || !logDir || !fs.existsSync(logDir)) return count;

    const shelfLifeMs = validityDays * 86_400_000; // 24 * 60 * 60 * 1000;
    const now = Date.now();
    const cleanDir = (dir: string) => {
      const list = fs.readdirSync(dir);

      for (let filepath of list) {
        filepath = resolve(dir, filepath);
        const stats = fs.statSync(filepath);
        if (stats.isDirectory()) cleanDir(filepath);
        else if (filepath.endsWith('.log') && stats.isFile() && now > stats.mtimeMs + shelfLifeMs) {
          fs.unlinkSync(filepath);
          count++;
        }
      }
    };
    cleanDir(logDir);

    if (count > 0) this.info(`log cleanup:`, count);

    return count;
  }
  /**
   * 写入到日志文件
   * @todo 增加分包支持
   */
  protected override writeToFile(msg: string) {
    // 若绑定了 winston，则转发给 winston
    if (this.winstonLogger) {
      // msg 形如: [time][tag][level] message\n
      const noColor = msg.replace(/\u001B\[\d+m/g, '').trim();
      
      // 尝试匹配格式: [time][tag][level] message
      // 支持多种格式：[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}.\d{3}][tag][level] message
      const match = /^(\[[^\]]+\])?(\[[^\]]+\])?\[([^\]]+)\]\s*(.+)$/.exec(noColor);
      if (match) {
        const timePart = match[1] ? match[1].slice(1, -1) : '';
        const tagPart = match[2] ? match[2] : '';
        const originalLevel = match[3] ? match[3].toLowerCase() : 'info';
        // 使用 winstonLevelMap 映射，如果没有则使用原始级别
        let level = (this.winstonLevelMap?.[originalLevel] || originalLevel).toLowerCase();
        
        const message = match[4] || '';
        
        // 构建完整的消息
        let fullMessage = timePart ? `[${timePart}]${tagPart} ${message}`.trim() : `${tagPart} ${message}`.trim();
        
        // 尝试使用 winston 的 log 方法或对应级别的方法
        try {
          if (typeof this.winstonLogger.log === 'function') {
            this.winstonLogger.log({ level, message: fullMessage });
          } else if (typeof this.winstonLogger[level] === 'function') {
            this.winstonLogger[level](fullMessage);
          } else if (typeof this.winstonLogger.info === 'function') {
            // 如果 winston 不支持该级别，降级到 info
            this.winstonLogger.info(fullMessage);
          }
        } catch (error) {
          // winston 调用失败，降级到控制台输出
          console.error('[QLogger] winston log failed:', error);
          console.log(noColor);
        }
        return;
      }
      
      // 如果正则匹配失败，尝试直接使用整条消息
      try {
        if (typeof this.winstonLogger.info === 'function') {
          this.winstonLogger.info(noColor);
        } else if (typeof this.winstonLogger.log === 'function') {
          this.winstonLogger.log({ level: 'info', message: noColor });
        }
      } catch (error) {
        console.error('[QLogger] winston log failed:', error);
        console.log(noColor);
      }
      return;
    }

    // 未使用 winston，使用原有的文件写入方式
    if (!this.logPath) return;
    let logFsStream = fsStreamCache[this.logPath];
    if (!logFsStream || logFsStream.destroyed) {
      if (!fs.existsSync(this.logDir)) fs.mkdirSync(this.logDir, { recursive: true });
      logFsStream = fs.createWriteStream(this.logPath, { encoding: 'utf8', flags: 'a' });
      fsStreamCache[this.logPath] = logFsStream;
    }
    // eslint-disable-next-line no-control-regex
    logFsStream.write(msg.replace(/\u001B\[\d+m/g, ''), 'utf8');
  }
  public logInline(msg: string, start = 0) {
    cursorTo(process.stdout as never, start);
    clearScreenDown(process.stdout as never);
    process.stdout.write(msg, 'utf8');
  }
  public static getLogger(tag?: string, options?: QLoggerOptions): QLogger {
    if (!tag) tag = '[general]';
    if (!QLogger.map[tag]) QLogger.map[tag] = new QLogger(tag, options);
    else if (options) QLogger.map[tag].updateOptions(options);
    return QLogger.map[tag];
  }

  /**
   * 创建 winston logger（包含 DailyRotateFile 支持）
   * @param tag 日志标签，用于生成文件名
   * @param options Winston 配置选项
   * @param defaultLogDir 默认日志目录
   * @returns winston logger 实例，如果 winston 未安装则返回 null
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static createWinstonLogger(tag: string, options: WinstonOptions = {}, defaultLogDir: string = './logs'): any {
    try {
      // 尝试动态导入 winston（可选依赖）
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const winston = require('winston');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const DailyRotateFile = require('winston-daily-rotate-file');

      const {
        enableConsole = true,
        consoleFormat = 'simple',
        enableFileRotate = true,
        fileRotateOptions = {},
        separateErrorLog = true,
        errorLogMaxFiles = '14d',
        jsonFormat = true,
        timestampFormat = 'YYYY-MM-DD HH:mm:ss',
      } = options;

      const {
        dirname = defaultLogDir,
        filename = `${tag}-%DATE%.log`,
        datePattern = 'YYYY-MM-DD',
        zippedArchive = true,
        maxSize = '20m',
        maxFiles = '7d',
      } = fileRotateOptions;

      const transports: any[] = [];

      // 控制台输出
      if (enableConsole) {
        const consoleTransportConfig: any = {
          level: 'silly', // 输出所有级别的日志
        };
        
        // 自定义 format：保存原始级别并映射为 info 用于标准 winston 格式
        const preserveOriginalLevel = winston.format((info: any) => {
          // 保存原始级别
          if (!info._originalLevel) {
            info._originalLevel = info.level;
          }
          // 如果级别是 log，映射为 info（用于 winston 内部处理，但不用于 colorize）
          if (info.level === 'log') {
            info._winstonLevel = 'info'; // 用于 winston 内部处理
            // 保持 info.level 为 log，我们不在这里映射，而是在手动 colorize 时处理
          }
          return info;
        });
        
        if (consoleFormat === 'json') {
          // JSON 格式不需要 colorize，保持原始级别
          consoleTransportConfig.format = winston.format.combine(
            winston.format.timestamp({ format: timestampFormat }),
            winston.format.json()
          );
        } else if (consoleFormat === 'colorize') {
          // colorize 格式：使用手动 colorize（避免 winston colorize 处理自定义级别）
          consoleTransportConfig.format = winston.format.combine(
            preserveOriginalLevel(),
            winston.format.timestamp({ format: timestampFormat }),
            winston.format.printf((info: any) => {
              const originalLevel = info._originalLevel || info.level;
              const displayLevel = originalLevel.toLowerCase();
              
              // 手动添加颜色（基于原始级别）
              let colorCode = '';
              let resetCode = '\u001b[0m';
              
              switch (originalLevel.toLowerCase()) {
                case 'error':
                  colorCode = '\u001b[31m'; // 红色
                  break;
                case 'warn':
                  colorCode = '\u001b[33m'; // 黄色
                  break;
                case 'info':
                  colorCode = '\u001b[36m'; // 青色
                  break;
                case 'log':
                  colorCode = '\u001b[36m'; // 青色（与 info 相同）
                  break;
                case 'debug':
                  colorCode = '\u001b[90m'; // 灰色
                  break;
                case 'verbose':
                  colorCode = '\u001b[35m'; // 紫色
                  break;
                case 'silly':
                  colorCode = '\u001b[37m'; // 白色
                  break;
                default:
                  colorCode = '';
              }
              
              return `${info.timestamp} ${colorCode}${displayLevel}${resetCode}: ${info.message}`;
            })
          );
        } else {
          // simple 格式：使用手动 colorize
          consoleTransportConfig.format = winston.format.combine(
            preserveOriginalLevel(),
            winston.format.printf((info: any) => {
              const originalLevel = info._originalLevel || info.level;
              const displayLevel = originalLevel.toLowerCase();
              
              // 手动添加颜色（基于原始级别）
              let colorCode = '';
              let resetCode = '\u001b[0m';
              
              switch (originalLevel.toLowerCase()) {
                case 'error':
                  colorCode = '\u001b[31m'; // 红色
                  break;
                case 'warn':
                  colorCode = '\u001b[33m'; // 黄色
                  break;
                case 'info':
                  colorCode = '\u001b[36m'; // 青色
                  break;
                case 'log':
                  colorCode = '\u001b[36m'; // 青色（与 info 相同）
                  break;
                case 'debug':
                  colorCode = '\u001b[90m'; // 灰色
                  break;
                case 'verbose':
                  colorCode = '\u001b[35m'; // 紫色
                  break;
                case 'silly':
                  colorCode = '\u001b[37m'; // 白色
                  break;
                default:
                  colorCode = '';
              }
              
              return `${colorCode}${displayLevel}${resetCode}: ${info.message}`;
            })
          );
        }
        
        transports.push(new winston.transports.Console(consoleTransportConfig));
      }

      // 文件轮转
      if (enableFileRotate) {
        const baseFormat = jsonFormat
          ? winston.format.combine(
              winston.format.timestamp({ format: timestampFormat }),
              winston.format.json()
            )
          : winston.format.combine(
              winston.format.timestamp({ format: timestampFormat }),
              winston.format.printf((info: any) => {
                return `${info.timestamp} [${info.level.toUpperCase()}] ${info.message}`;
              })
            );

        // 所有日志（包括 log 级别）
        transports.push(
          new DailyRotateFile({
            dirname,
            filename,
            datePattern,
            zippedArchive,
            maxSize,
            maxFiles,
            level: 'log', // 设置为 log 级别，确保 log 级别的日志也能写入
            format: baseFormat,
          })
        );

        // 错误日志单独文件
        if (separateErrorLog) {
          const errorFilename = filename.replace('.log', '.error.log');
          transports.push(
            new DailyRotateFile({
              dirname,
              filename: errorFilename,
              datePattern,
              zippedArchive,
              maxSize,
              maxFiles: errorLogMaxFiles,
              level: 'error',
              format: baseFormat,
            })
          );
        }
      }

      // 自定义级别，添加 log 级别（位于 info 和 verbose 之间）
      const customLevels = {
        error: 0,
        warn: 1,
        info: 2,
        log: 3, // 添加 log 级别
        verbose: 4,
        debug: 5,
        silly: 6,
      };

      return winston.createLogger({
        levels: customLevels,
        level: 'silly', // 接受所有级别的日志
        format: winston.format.combine(
          winston.format.timestamp({ format: timestampFormat }),
          winston.format.json()
        ),
        transports,
      });
    } catch (error) {
      // winston 未安装或导入失败，返回 null
      console.warn(
        '[QLogger] winston or winston-daily-rotate-file not installed. Please install them:\n' +
        '  npm install winston winston-daily-rotate-file\n' +
        'Or use QLogger without winston integration.'
      );
      return null;
    }
  }
}
