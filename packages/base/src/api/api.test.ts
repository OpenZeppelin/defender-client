import axios from 'axios';
import { createApi } from './api';

jest.mock('axios');

const apiUrl = 'http://api.defender.openzeppelin.com/';
const key = 'key';
const token = 'token';

describe('createApi', () => {
  test('passes correct arguments to axios', () => {
    createApi(key, token, apiUrl);
    expect(axios.create).toBeCalledWith({
      baseURL: apiUrl,
      headers: {
        'X-Api-Key': key,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  });
});
