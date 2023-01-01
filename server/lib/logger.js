'use strict';

const path = require('path');

const log4js = require('log4js');

const stringify = require('json-stringify-safe');

const logfilename = 'server.log';

// eslint-disable-next-line arrow-body-style
log4js.addLayout('json', (config) => {
  return function (logEvent) {
    return stringify({
      startTime: logEvent.startTime,
      categoryName: logEvent.categoryName,
      data: logEvent.data,
      level: logEvent.level.levelStr,
      functionName: logEvent.functionName,
      fileName: logEvent.fileName + ':' + logEvent.lineNumber,
      lineNumber: logEvent.lineNumber
    }) + config.separator;
  };
});

log4js.configure({
  appenders: {
    file: {
      type: 'file',
      // eslint-disable-next-line no-undef
      filename: path.join(__extdir, 'log', logfilename),
      maxLogSize: 3 * 1024 * 1024,
      backups: 3,
      layout: {
        type: 'json',
        separator: ','
      }
    },
    out: {
      type: 'stdout',
      layout: {
        type: 'pattern',
        pattern: '%[%p%] %d{hh:mm:ss,SSS} %[%m%] %f:%l'
      }
    }
  },
  categories: {
    default: {
      appenders: [ 'file', 'out' ],
      level: 'debug',
      enableCallStack: true
    }
  }
});

const logger = log4js.getLogger();

module.exports = logger;
