import { BlockExplorerApiKeyClient } from './block-explorer-api-key';
import { DeploymentClient } from './deployment';
import { DeploymentConfigClient } from './deployment-config';

interface PlatformClient {
  Deployment: DeploymentClient;
  DeploymentConfig: DeploymentConfigClient;
  BlockExplorerApiKey: BlockExplorerApiKeyClient;
}

export function PlatformClient(params: { apiKey: string; apiSecret: string }): PlatformClient {
  return {
    Deployment: new DeploymentClient(params),
    DeploymentConfig: new DeploymentConfigClient(params),
    BlockExplorerApiKey: new BlockExplorerApiKeyClient(params),
  };
}
