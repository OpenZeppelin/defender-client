module.exports = {
  createApi: jest.fn(() => ({
    post: jest.fn(),
    get: jest.fn(),
  })),
};
