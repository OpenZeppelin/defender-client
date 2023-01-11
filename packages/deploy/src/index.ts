export { PlatformClient } from './api';
export { BlockExplorerApiKeyClient } from './api/block-explorer-api-key';
export { DeploymentClient } from './api/deployment';
export { DeploymentConfigClient } from './api/deployment-config';
export * from './models';

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const VERSION = require('../package.json').version;
