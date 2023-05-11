const deps = require('./deps');

exports.handler = async function () {
  const value = deps.foo();
  console.log(value);
  return value;
};
