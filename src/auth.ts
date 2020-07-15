// Adapted from https://gist.githubusercontent.com/efimk-lu/b48fa118bd29a35fc1767fe749fa3372/raw/0662fee3eb5c65172fdf85c4bdfcb96eabce5e21/authentication-example.js

import { AuthenticationDetails, CognitoUserPool, CognitoUser } from 'amazon-cognito-identity-js';

global.fetch = require('node-fetch');

export const RelayerPoolId = process.env.RELAY_POOL_ID || 'us-west-2_iLmIggsiy';
export const RelayerPoolClientId = process.env.RELAY_POOL_CLIENT_ID || '1bpd19lcr33qvg5cr3oi79rdap';

type UserPass = { Username: string; Password: string };

export async function authenticate(authenticationData: UserPass): Promise<string> {
  const authenticationDetails = new AuthenticationDetails(authenticationData);
  const poolData = {
    UserPoolId: RelayerPoolId,
    ClientId: RelayerPoolClientId,
  };

  const userPool = new CognitoUserPool(poolData);
  const userData = { Username: authenticationData.Username, Pool: userPool };
  const cognitoUser = new CognitoUser(userData);

  return new Promise((resolve, reject) => {
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: function (result) {
        const token = result.getIdToken().getJwtToken();
        resolve(token);
      },
      onFailure: function (err) {
        console.error(`Failed to get a token for the API key ${authenticationData.Username}`, err);
        reject(err);
      },
    });
  });
}
