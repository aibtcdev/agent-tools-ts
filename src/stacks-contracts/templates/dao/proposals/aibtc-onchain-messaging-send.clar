(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Send a message from the DAO")
(define-constant CFG_MESSAGE_CONTRACT <%= it.message_contract %>)

(define-public (execute (sender principal))
  ;; sends a verified message from the dao
  (contract-call? <%= it.message_contract %> send CFG_MESSAGE true)
)
