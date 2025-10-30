/* eslint no-console: 0 */
import { dirname, resolve } from 'node:path';
import type { WriteStream } from 'node:fs';
import { clearScreenDown, cursorTo } from 'node:readline';
import { color } from 'console-log-colors';
import { fs } from '../fs-system';
import { Logger, type LoggerOptions } from '../../common/libs/Logger';

const fsStreamCache: { [logPath: string]: WriteStream } = {};

/** 用于 Node.js 中的 logger 模块 */
export interface QLoggerOptions extends LoggerOptions {
  /** 若提供，则由外部 winston 实例负责写入与转储（本类将静默控制台输出） */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  winstonLogger?: any;
  /** 映射内部日志级别到 winston 级别名，未提供则同名 */
  winstonLevelMap?: Partial<Record<keyof typeof import('../../common/libs/Logger').LogLevel, string>>;
}

export class QLogger extends Logger {
  public static map: { [tag: string]: QLogger } = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private winstonLogger?: any;
  private winstonLevelMap?: Record<string, string>;

  constructor(tag: string, options: LoggerOptions = {}) {
    if (!options.color) options.color = color;
    super(tag, options);

    const { winstonLogger, winstonLevelMap } = options as QLoggerOptions;
    if (winstonLogger) this.setWinstonLogger(winstonLogger, winstonLevelMap);
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
      const noColor = msg.replace(/\u001B\[\d+m/g, '');
      const match = /(\[[^\]]+\])?(\[[^\]]+\])?\[([^\]]+)\]\s(.+)/.exec(noColor);
      if (match) {
        const level = (this.winstonLevelMap?.[match[3]] || match[3] || 'info').toLowerCase();
        const message = `[${match[1]?.slice(1, -1) || ''}]${match[2] || ''} ${match[4]}`.trim();
        if (typeof this.winstonLogger.log === 'function') this.winstonLogger.log({ level, message });
        else if (typeof this.winstonLogger[level] === 'function') this.winstonLogger[level](message);
        return;
      }
      if (typeof this.winstonLogger.info === 'function') this.winstonLogger.info(noColor.trim());
      return;
    }

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
  public static getLogger(tag?: string, options?: LoggerOptions): QLogger {
    if (!tag) tag = '[general]';
    if (!QLogger.map[tag]) QLogger.map[tag] = new QLogger(tag, options);
    else if (options) QLogger.map[tag].updateOptions(options);
    return QLogger.map[tag];
  }
}
