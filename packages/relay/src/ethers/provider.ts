import { JsonRpcSigner, Network, StaticJsonRpcProvider } from '@ethersproject/providers';
import { Relayer, RelayerParams } from '../relayer';
import { DefenderRelaySigner } from './signer';
import { defineReadOnly, getStatic } from '@ethersproject/properties';
import { Networkish } from '@ethersproject/networks';
import { BigNumber } from '@ethersproject/bignumber';
import { RelaySignerApiUrl } from '../api';

export class DefenderRelayProvider extends StaticJsonRpcProvider {
  private relayer: Relayer;

  constructor(readonly credentials: RelayerParams) {
    super(RelaySignerApiUrl());
    this.relayer = new Relayer(credentials);
  }

  async detectNetwork(): Promise<Network> {
    if (this.network != null) {
      return this.network;
    }

    // Logic from JsonRpcProvider.detectNetwork
    let chainId = null;
    try {
      chainId = await this.send('eth_chainId', []);
    } catch (error) {
      try {
        chainId = await this.send('net_version', []);
      } catch (error) {
        // Key difference from JsonRpcProvider.detectNetwork logic
        // This surfaces error to caller (like QuotaExceeded) instead of squashing it
        throw error;
      }
    }

    if (chainId === null) {
      throw new Error('could not detect chainId');
    }

    // Logic from JsonRpcProvider.detectNetwork
    const getNetwork = getStatic<(network: Networkish) => Network>(this.constructor, 'getNetwork');
    const network = getNetwork(BigNumber.from(chainId).toNumber());

    if (!network) {
      throw new Error('could not detect network');
    }

    // Logic from StaticJsonRpcProvider.detectNetwork
    if (this._network == null) {
      defineReadOnly(this, '_network', network);
      this.emit('network', network, null);
    }

    return network;
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
