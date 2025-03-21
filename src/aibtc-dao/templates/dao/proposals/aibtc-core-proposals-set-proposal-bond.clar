(impl-trait '<%= it.dao_proposal_trait %>)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Updated proposal bond amount in the core proposals extension")
(define-constant CFG_BOND_AMOUNT <%= it.bond_amount %>)

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? '<%= it.message_contract %> send CFG_MESSAGE true))
    ;; update proposal bond amount
    (contract-call? '<%= it.core_proposals_contract %> set-proposal-bond CFG_BOND_AMOUNT)
  )
)
