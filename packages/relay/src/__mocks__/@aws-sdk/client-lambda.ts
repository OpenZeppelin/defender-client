const Lambda = jest.fn(() => ({
  invoke: jest.fn(() =>
    Promise.resolve({
      Payload: {
        transformToString: () => JSON.stringify({ result: 'result' }),
      },
    }),
  ),
}));

export { Lambda };
