
import { color } from 'console-log-colors';
import { NLogger } from './libs/NLogger';
import { type LogLevelType } from './../common/libs';

export function getLogger(tag = '[FEUTILS]', levelType?: LogLevelType): NLogger {
  return NLogger.getLogger(tag, { levelType, color });
}
