import { ExternalApiCreateProposalRequest } from './proposal';

export interface ExternalApiProposalResponse extends ExternalApiCreateProposalRequest {
  contractIds?: string[];
  contractId: string;
  proposalId: string;
  createdAt: string;
  isActive: boolean;
  isArchived: boolean;
}
