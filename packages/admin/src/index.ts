export { AdminClient, ProposalResponseWithUrl as ProposalResponse } from './api';
export { ExternalApiCreateProposalRequest as CreateProposalRequest } from './models/proposal';
export { Contract } from './models/contract';
export { VerificationRequest, Verification } from './models/verification';

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const VERSION = require('../package.json').version;
