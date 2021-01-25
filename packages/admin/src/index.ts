export { AdminClient, ProposalResponseWithUrl as ProposalResponse } from './api';
export { ExternalApiCreateProposalRequest as CreateProposalRequest } from './models/proposal';

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const VERSION = require('../package.json').version;
