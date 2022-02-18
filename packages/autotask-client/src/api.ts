import { BaseApiClient } from 'defender-base-client';
import { zipFolder, zipSources } from './zip';
import { ListAutotaskResponse, CreateAutotaskResponse } from './models/response';
import { CreateAutotaskRequest } from './models/config';

type SourceFiles = {
  'index.js': string;
  [name: string]: string;
};

export class AutotaskClient extends BaseApiClient {
  protected getPoolId(): string {
    return process.env.DEFENDER_AUTOTASK_POOL_ID || 'us-west-2_94f3puJWv';
  }

  protected getPoolClientId(): string {
    return process.env.DEFENDER_AUTOTASK_POOL_CLIENT_ID || '40e58hbc7pktmnp9i26hh5nsav';
  }

  protected getApiUrl(): string {
    return process.env.DEFENDER_AUTOTASK_API_URL || 'https://defender-api.openzeppelin.com';
  }

  public async list(): Promise<ListAutotaskResponse> {
    return this.apiCall(async (api) => {
      return (await api.get('/autotasks/summary')) as ListAutotaskResponse;
    });
  }

  public async get(autotaskId: string): Promise<CreateAutotaskResponse> {
    return this.apiCall(async (api) => {
      const response = (await api.get(`/autotasks/${autotaskId}`)) as CreateAutotaskResponse;
      return response;
    });
  }

  public async updateCodeFromZip(autotaskId: string, zippedCode: Buffer): Promise<void> {
    const encodedZippedCode = zippedCode.toString('base64');
    return this.updateCode(autotaskId, encodedZippedCode);
  }

  public async updateCodeFromSources(autotaskId: string, sources: SourceFiles): Promise<void> {
    const encodedZippedCode = await zipSources(sources);
    return this.updateCode(autotaskId, encodedZippedCode);
  }

  public async updateCodeFromFolder(autotaskId: string, path: string): Promise<void> {
    const encodedZippedCode = await zipFolder(path);
    return this.updateCode(autotaskId, encodedZippedCode);
  }

  private async updateCode(autotaskId: string, encodedZippedCode: string): Promise<void> {
    return this.apiCall(async (api) => {
      return await api.put(`/autotask/autotasks/${autotaskId}/code`, { encodedZippedCode });
    });
  }

  public async create(autotask: CreateAutotaskRequest): Promise<CreateAutotaskResponse> {
    return this.apiCall(async (api) => {
      const response = (await api.post('/autotasks', autotask)) as CreateAutotaskResponse;
      return response;
    });
  }
}
