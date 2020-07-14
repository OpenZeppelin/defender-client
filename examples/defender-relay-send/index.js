require('dotenv').config();

const { Relayer } = require('@openzeppelin/defender-client');

const relayer = new Relayer(
  '7T7nUrGUUVovHgHLYis9NkdJBN82vwM6',
  '2ndoRSb8embSxdsX3qbgncyYbwLNbAT2md3GtBwC9h7coovNvwSE9m4E6t4mVBxF',
);

relayer
  .sendTransaction({
    to: '0xc7dd3ff5b387db0130854fe5f141a78586f417c6',
    value: 100,
    data: '0x',
    speed: 'fast',
    gasLimit: '1000000',
  })
  .then(console.log, console.log);
