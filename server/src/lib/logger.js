function writeLog(level, message, metadata = {}) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...metadata,
  };

  process.stdout.write(`${JSON.stringify(entry)}\n`);
}

function info(message, metadata) {
  writeLog('info', message, metadata);
}

function error(message, metadata) {
  writeLog('error', message, metadata);
}

module.exports = { info, error };
