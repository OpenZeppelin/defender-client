const deps = require('./deps');

exports.handler = async function () {
  const value = deps.foo();
  console.log(value);
  console.log('Environment Variable [hello]:', process.env.hello);
  return value;
};
