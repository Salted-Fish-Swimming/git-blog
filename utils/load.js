global.load = (path, ...args) => {
  const LoadModule = require(path);
  return LoadModule(...args);
}

module.exports = global.load;