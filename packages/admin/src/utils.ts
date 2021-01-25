import { ExternalApiProposalResponse } from './models/response';

import { DEFENDER_APP_URL } from 'defender-base-client';

export function getProposalUrl(proposal: Pick<ExternalApiProposalResponse, 'contractId' | 'proposalId'>): string {
  return `${DEFENDER_APP_URL}/#/admin/contracts/${proposal.contractId}/proposals/${proposal.proposalId}`;
}
