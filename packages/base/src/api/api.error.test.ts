import { pick } from 'lodash';
import { rejectWithDefenderApiError } from './api';
import { DefenderApiResponseError } from './api-error';
import { mockAxiosError } from './__mocks__/axios-error';

const expectedRejectObjectStructure = {
  response: {
    status: 401,
    statusText: 'Unauthorized',
    data: { message: 'Unauthorized' },
  },
  message: 'Request failed with status code 401',
  request: { path: '/relayer', method: 'GET' },
};

describe('DefenderApiError', () => {
  test('request rejection reject with a DefenderApiResponseError that include message, request.path, request.method, response.status, response.statusText, response.data', async () => {
    try {
      await rejectWithDefenderApiError(mockAxiosError);
    } catch (error) {
      expect(error instanceof DefenderApiResponseError).toBe(true);

      expect(error.message).toStrictEqual(expectedRejectObjectStructure.message);
      expect(error.response).toStrictEqual(expectedRejectObjectStructure.response);
      expect(error.request).toStrictEqual(expectedRejectObjectStructure.request);
    }
  });

  test('throw an Error that is backward compatible with previous rejected object structure', async () => {
    const previousRejectionMethod = (error: any) =>
      Promise.reject({
        response: pick(error.response, 'status', 'statusText', 'data'),
        message: error.message,
        request: pick(error.request, 'path', 'method'),
      });

    try {
      await previousRejectionMethod(mockAxiosError);
    } catch (error) {
      expect(error).toStrictEqual(expectedRejectObjectStructure);
    }
  });
});
