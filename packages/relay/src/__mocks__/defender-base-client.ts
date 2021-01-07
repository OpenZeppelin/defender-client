module.exports = {
  authenticate: jest.fn(),
  createAuthenticatedApi: jest.fn(() => ({
    post: jest.fn(),
    get: jest.fn(),
  })),
  createApi: jest.fn(() => ({
    post: jest.fn(),
    get: jest.fn(),
  })),
};
