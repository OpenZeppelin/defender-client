import { getAuthenticationToken, UserCredentials } from './auth';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { mockAuthenticateUser } = require('./__mocks__/amazon-cognito-identity-js');

jest.mock('amazon-cognito-identity-js');

const authData: UserCredentials = {
  apiKey: 'user',
  apiSecret: 'pwd',
};

describe('getAuthenticationToken', () => {
  test('passes correct arguments to Cognito', async () => {
    await getAuthenticationToken(authData, { ClientId: 'CLIENT', UserPoolId: 'POOL' });
    expect(mockAuthenticateUser).toBeCalledWith(
      expect.objectContaining({
        username: 'user',
        password: 'pwd',
      }),
      expect.any(Object),
    );
  });
});
