(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Delegate STX for stacking")
(define-constant CFG_AMOUNT <%= it.amount %>)
(define-constant CFG_DELEGATE_TO <%= it.delegate_to %>)
(define-constant CFG_MESSAGE_CONTRACT <%= it.message_contract %>)
(define-constant CFG_TREASURY_CONTRACT <%= it.treasury_contract %>)

(define-public (execute (sender principal))
  (begin 
    ;; send a message from the dao
    (try! (contract-call? <%= it.message_contract %> send CFG_MESSAGE true))
    ;; delegate STX for stacking
    (contract-call? <%= it.treasury_contract %> delegate-stx CFG_AMOUNT <%= it.delegate_to %>)
  )
)
