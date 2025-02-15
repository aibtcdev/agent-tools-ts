(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Allow an asset for deposit and withdrawal in the treasury")
(define-constant CFG_ASSET <%= it.asset_contract %>)
(define-constant CFG_MESSAGE_CONTRACT <%= it.message_contract %>)
(define-constant CFG_TREASURY_CONTRACT <%= it.treasury_contract %>)

(define-public (execute (sender principal))
  (begin 
    ;; send a message from the dao
    (try! (contract-call? <%= it.message_contract %> send CFG_MESSAGE true))
    ;; allow an asset for deposit and withdrawal in the treasury
    (contract-call? <%= it.treasury_contract %> allow-asset <%= it.asset_contract %> true)
  )
)
