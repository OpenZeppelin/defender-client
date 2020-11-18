import axios from 'axios';
import { createApi } from './api';

const ApiUrl = process.env.API_URL || 'http://api.defender.openzeppelin.com/';
const key = 'key';
const token = 'token';

describe('createApi', () => {
  test('passes correct arguments to axois', () => {
    createApi(key, token);
    expect(axios.create).toBeCalledWith({
      baseURL: ApiUrl,
      headers: {
        'X-Api-Key': key,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  });
});
