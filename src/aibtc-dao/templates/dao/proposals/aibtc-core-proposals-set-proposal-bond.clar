(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Updated proposal bond amount in the core proposals extension")
(define-constant CFG_BOND_AMOUNT u100)

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    ;; update proposal bond amount
    (contract-call? .aibtc-core-proposals-v2 set-proposal-bond CFG_BOND_AMOUNT)
  )
)
