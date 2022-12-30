import { createHash } from 'crypto';
import { BaseApiClient } from 'defender-base-client';
import {
  CreateAutotaskRequest,
  UpdateAutotaskRequest,
  GetSecretsResponse,
  SaveSecretsRequest,
} from './models/autotask';
import {
  AutotaskRunBase,
  AutotaskRunListResponse,
  AutotaskRunResponse,
  AutotaskRunStatus,
} from './models/autotask-run.res';
import { AutotaskDeleteResponse, AutotaskListResponse, AutotaskResponse } from './models/response';
import { zipFolder, zipSources } from './zip';

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
    return process.env.DEFENDER_AUTOTASK_API_URL || 'https://defender-api.openzeppelin.com/autotask/';
  }

  public async list(): Promise<AutotaskListResponse> {
    return this.apiCall(async (api) => {
      return await api.get(`/autotasks`);
    });
  }

  public async get(autotaskId: string): Promise<AutotaskResponse> {
    return this.apiCall(async (api) => {
      return await api.get(`/autotasks/${autotaskId}`);
    });
  }

  public async delete(autotaskId: string): Promise<AutotaskDeleteResponse> {
    return this.apiCall(async (api) => {
      return await api.delete(`/autotasks/${autotaskId}`);
    });
  }

  public async create(autotask: CreateAutotaskRequest): Promise<AutotaskResponse> {
    return this.apiCall(async (api) => {
      return await api.post(`/autotasks`, autotask);
    });
  }

  public async update(autotask: UpdateAutotaskRequest): Promise<AutotaskResponse> {
    return this.apiCall(async (api) => {
      return await api.put(`/autotasks/`, autotask);
    });
  }

  public getEncodedZippedCodeFromBuffer(code: Buffer): string {
    return code.toString('base64');
  }

  public async getEncodedZippedCodeFromSources(code: SourceFiles): Promise<string> {
    return await zipSources(code);
  }

  public async getEncodedZippedCodeFromFolder(code: string): Promise<string> {
    return await zipFolder(code);
  }

  public async updateCodeFromZip(autotaskId: string, zippedCode: Buffer): Promise<void> {
    const encodedZippedCode = this.getEncodedZippedCodeFromBuffer(zippedCode);
    return this.updateCode(autotaskId, encodedZippedCode);
  }

  public async updateCodeFromSources(autotaskId: string, sources: SourceFiles): Promise<void> {
    const encodedZippedCode = await this.getEncodedZippedCodeFromSources(sources);
    return this.updateCode(autotaskId, encodedZippedCode);
  }

  public async updateCodeFromFolder(autotaskId: string, path: string): Promise<void> {
    const encodedZippedCode = await this.getEncodedZippedCodeFromFolder(path);
    return this.updateCode(autotaskId, encodedZippedCode);
  }

  public async listAutotaskRuns(
    autotaskId: string,
    next?: string,
    status?: AutotaskRunStatus | undefined,
  ): Promise<AutotaskRunListResponse> {
    if (next && !status && (next === 'success' || next === 'error' || next === 'pending' || next === 'throttle')) {
      status = next as AutotaskRunStatus;
      next = undefined;
    }
    return this.apiCall(async (api) => {
      return api.get(`/autotasks/${autotaskId}/runs`, { params: { next, status } });
    });
  }

  public async getAutotaskRun(autotaskRunId: string): Promise<AutotaskRunResponse> {
    return this.apiCall(async (api) => {
      return await api.get(`/autotasks/runs/${autotaskRunId}`);
    });
  }

  public async runAutotask(autotaskId: string, data: { [key: string]: any }): Promise<AutotaskRunBase> {
    return this.apiCall(async (api) => {
      return await api.post(`/autotasks/${autotaskId}/runs/manual`, data);
    });
  }

  public getCodeDigest(encodedZippedCode: string): string {
    const binary = Buffer.from(encodedZippedCode, 'base64');
    return createHash('SHA256').update(binary).end().digest('base64');
  }

  private async updateCode(autotaskId: string, encodedZippedCode: string): Promise<void> {
    return this.apiCall(async (api) => {
      return await api.put(`/autotasks/${autotaskId}/code`, { encodedZippedCode });
    });
  }

  public async createSecrets(data: SaveSecretsRequest): Promise<GetSecretsResponse> {
    return this.apiCall(async (api) => {
      return await api.post(`/secrets`, data);
    });
  }

  public async listSecrets(): Promise<GetSecretsResponse> {
    return this.apiCall(async (api) => {
      return await api.get(`/secrets`);
    });
  }
}
