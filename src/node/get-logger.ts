
import { color } from 'console-log-colors';
import { QLogger } from './libs/QLogger';
import { type LogLevelType } from './../common/libs';

export function getLogger(tag = '[FEUTILS]', levelType?: LogLevelType): QLogger {
  return QLogger.getLogger(tag, { levelType, color });
}
