(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Delegate STX for stacking")
(define-constant CFG_AMOUNT u1000000)
(define-constant CFG_DELEGATE_TO 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
;; was CFG_MESSAGE_CONTRACT .aibtc-onchain-messaging
;; was CFG_TREASURY_CONTRACT .aibtc-treasury

(define-public (execute (sender principal))
  (begin 
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    ;; delegate STX for stacking
    (contract-call? .aibtc-treasury delegate-stx CFG_AMOUNT CFG_DELEGATE_TO)
  )
)
