const token = 'token';
const mockAuthenticateUser = jest.fn((details, callbacks) => {
  callbacks.onSuccess({
    getIdToken: () => ({
      getJwtToken: () => token,
    }),
  });
});

module.exports = {
  ...jest.requireActual('amazon-cognito-identity-js'),
  CognitoUser: jest.fn(() => ({
    authenticateUser: mockAuthenticateUser,
  })),
  mockAuthenticateUser,
};
