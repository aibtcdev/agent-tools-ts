import { TRAITS } from "../../../constants";

export function generateAddExtension(params: {
  executorId: string;
  extensionId: string;
  network: "mainnet" | "testnet";
}): string {
  const { executorId, extensionId, network } = params;

  return `;; title: monarchy-proposal-${Date.now()}
;; version: 1.0.0
;; summary: Proposal to add extension

;; traits
;;
(impl-trait '${TRAITS[network].PROPOSAL})

;; public functions
;;
(define-public (execute (sender principal))
  (contract-call? '${executorId} set-extension '${extensionId} true)
)`;
}
