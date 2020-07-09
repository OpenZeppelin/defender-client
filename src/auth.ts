// Adapted from https://gist.githubusercontent.com/efimk-lu/b48fa118bd29a35fc1767fe749fa3372/raw/0662fee3eb5c65172fdf85c4bdfcb96eabce5e21/authentication-example.js

import { AuthenticationDetails, CognitoUserPool, CognitoUser } from 'amazon-cognito-identity-js';
import config from './config';

global.fetch = require('node-fetch');

type UserPass = { Username: string; Password: string };

export async function authenticate(authenticationData: UserPass): Promise<string> {
  const authenticationDetails = new AuthenticationDetails(authenticationData);
  const poolData = {
    UserPoolId: config.RelayerPoolId,
    ClientId: config.RelayerPoolClientId,
  };

  const userPool = new CognitoUserPool(poolData);
  const userData = { Username: authenticationData.Username, Pool: userPool };
  const cognitoUser = new CognitoUser(userData);

  return new Promise((resolve, reject) => {
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: function (result) {
        console.log(`API key ${authenticationData.Username}`);
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
