import { config } from './config';
const levels = ['debug', 'info', 'warn', 'error', 'none'];
const levelToInt = {};
const intToLevel = {};
for (let index = 0; index < levels.length; index++) {
    const level = levels[index];
    levelToInt[level] = index;
    intToLevel[index] = level;
}
export class Logger {
    static error(message) {
        if (!this.shouldLog('error'))
            return;
        console.error(this.logMessage('error', message));
    }
    static warn(message) {
        if (!this.shouldLog('warn'))
            return;
        console.warn(this.logMessage('warn', message));
    }
    static info(message) {
        if (!this.shouldLog('info'))
            return;
        console.log(this.logMessage('info', message));
    }
    static debug(message) {
        if (!this.shouldLog('debug'))
            return;
        console.log(this.logMessage('debug', message));
    }
    static logMessage(level, message) {
        return `[${level.toUpperCase()}] ${message}`;
    }
    static shouldLog(level) {
        const currentLevel = levelToInt[config.logLevel];
        return currentLevel <= levelToInt[level];
    }
}
//# sourceMappingURL=logger.js.map