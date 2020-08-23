module.exports = {
  Lambda: jest.fn(() => ({
    invoke: jest.fn(() => ({
      promise: jest.fn(() =>
        Promise.resolve({
          Payload: JSON.stringify({ result: 'result' }),
        }),
      ),
    })),
  })),
};
