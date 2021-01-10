export { AdminClient } from './api';
export { UpgradesClient, UpgradeParams } from './upgrades';
export { ExternalApiCreateProposalRequest as CreateProposalRequest } from './models/proposal';
export { ExternalApiProposalResponse as ProposalResponse } from './models/response';

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const VERSION = require('../package.json').version;
