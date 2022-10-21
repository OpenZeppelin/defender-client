// Adapted from https://gist.githubusercontent.com/efimk-lu/b48fa118bd29a35fc1767fe749fa3372/raw/0662fee3eb5c65172fdf85c4bdfcb96eabce5e21/authentication-example.js

// https://github.com/aws-amplify/amplify-js/issues/7098
// fix for amazon-cognito-identity
global.crypto = require('crypto');

import { AuthenticationDetails, CognitoUserPool, CognitoUser } from 'amazon-cognito-identity-js';
import retry from 'async-retry';

// https://github.com/node-fetch/node-fetch/issues/450#issuecomment-387045223
// in order to support:
// commonjs code without bundling i.e. node app.js
// commonjs code with webpack bundling
// eslint-disable-next-line @typescript-eslint/no-var-requires
global.fetch = require('node-fetch').default;

export type JWT = string;

export type UserCredentials = { apiKey: string; apiSecret: string };
export type InternallyManagedCredentials = { apiKey: string; jwt: JWT };

export type ClientCredentials = UserCredentials | InternallyManagedCredentials;

export type PoolData = { UserPoolId: string; ClientId: string };

export function clientIsAuthenticatedWithJwt(
  credentials: ClientCredentials,
): credentials is InternallyManagedCredentials {
  return credentials.hasOwnProperty('jwt');
}

export async function getAuthenticationToken(authenticationData: UserCredentials, poolData: PoolData): Promise<string> {
  const cognitoIdentity = { Username: authenticationData.apiKey, Password: authenticationData.apiSecret };
  const authenticationDetails = new AuthenticationDetails(cognitoIdentity);
  const userPool = new CognitoUserPool(poolData);
  const userData = { Username: cognitoIdentity.Username, Pool: userPool };
  const cognitoUser = new CognitoUser(userData);

  try {
    return await retry(() => doAuthenticate(cognitoUser, authenticationDetails), { retries: 3 });
  } catch (error) {
    throw new Error(
      `Failed to get a token for the API key ${cognitoIdentity.Username}: ${(error as Error).message || error}`,
    );
  }
}

function doAuthenticate(cognitoUser: CognitoUser, authenticationDetails: AuthenticationDetails): Promise<string> {
  return new Promise((resolve, reject) => {
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: function (session) {
        const token = session.getAccessToken().getJwtToken();
        resolve(token);
      },
      onFailure: function (error) {
        reject(error);
      },
    });
  });
}
