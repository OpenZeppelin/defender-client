import { ExternalApiCreateProposalRequest } from "./proposal";

export interface ExternalApiProposalResponse extends ExternalApiCreateProposalRequest {
  contractId: string;
  proposalId: string;
  createdAt: string;
}
