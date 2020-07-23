import { authenticate } from './auth';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { mockAuthenticateUser } = require('./__mocks__/amazon-cognito-identity-js');

const authData = {
  Username: 'user',
  Password: 'pwd',
};

describe('authenticate', () => {
  test('passes correct arguments to Cognito', async () => {
    await authenticate(authData);
    expect(mockAuthenticateUser).toBeCalledWith(
      expect.objectContaining({
        username: 'user',
        password: 'pwd',
      }),
      expect.any(Object),
    );
  });
});
