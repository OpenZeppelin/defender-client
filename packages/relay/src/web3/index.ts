import { Relayer, RelayerParams } from '../relayer';
import { DefenderRelayQueryProvider } from './query';
import { DefenderRelaySenderProvider, DefenderRelaySenderOptions } from './sender';

export { DefenderRelayQueryProvider, DefenderRelaySenderProvider, DefenderRelaySenderOptions };

export class DefenderRelayProvider extends DefenderRelaySenderProvider {
  constructor(relayerCredentials: RelayerParams, options: DefenderRelaySenderOptions) {
    const relayer = new Relayer(relayerCredentials);
    super(new DefenderRelayQueryProvider(relayer), relayer, options);
  }
}
