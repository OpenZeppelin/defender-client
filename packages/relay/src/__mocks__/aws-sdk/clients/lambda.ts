const mock = jest.fn(() => ({
  invoke: jest.fn(() => ({
    promise: jest.fn(() =>
      Promise.resolve({
        Payload: JSON.stringify({ result: 'result' }),
      }),
    ),
  })),
}));

export default mock;
