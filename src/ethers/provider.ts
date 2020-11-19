import { JsonRpcSigner, Network, StaticJsonRpcProvider } from '@ethersproject/providers';
import { ApiUrl } from '../api/api';
import { Relayer, RelayerParams } from '../relayer';
import { DefenderRelaySigner } from './signer';

export class DefenderRelayProvider extends StaticJsonRpcProvider {
  private relayer: Relayer;

  constructor(readonly credentials: RelayerParams) {
    super(ApiUrl());
    this.relayer = new Relayer(credentials);
  }

  async send(method: string, params: Array<any>): Promise<any> {
    const request = { method, params };
    this.emit('debug', { action: 'request', request, provider: this });
    try {
      const result = await this.relayer.call(method, params);
      this.emit('debug', { action: 'response', request, response: result, provider: this });
      if (result.error) {
        const error: any = new Error(result.error.message);
        error.code = result.error.code;
        error.data = result.error.data;
        throw error;
      }
      return result.result;
    } catch (error) {
      this.emit('debug', { action: 'response', error, request: request, provider: this });
      throw error;
    }
  }

  getSigner(): JsonRpcSigner {
    return (new DefenderRelaySigner(this.relayer, this, {}) as any) as JsonRpcSigner;
  }
}
