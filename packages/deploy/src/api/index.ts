import { BlockExplorerApiKeyClient } from './block-explorer-api-key';
import { DeploymentClient } from './deployment';
import { DeploymentConfigClient } from './deployment-config';
import { UpgradeClient } from './upgrade';

interface PlatformClient {
  Deployment: DeploymentClient;
  Upgrade: UpgradeClient;
  DeploymentConfig: DeploymentConfigClient;
  BlockExplorerApiKey: BlockExplorerApiKeyClient;
}

export function PlatformClient(params: { apiKey: string; apiSecret: string }): PlatformClient {
  return {
    Deployment: new DeploymentClient(params),
    Upgrade: new UpgradeClient(params),
    DeploymentConfig: new DeploymentConfigClient(params),
    BlockExplorerApiKey: new BlockExplorerApiKeyClient(params),
  };
}
