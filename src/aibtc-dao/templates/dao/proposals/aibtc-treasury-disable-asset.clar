(impl-trait '<%= it.dao_proposal_trait %>)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Disabled an asset for deposit and withdrawal in the treasury")
(define-constant CFG_ASSET_CONTRACT '<%= it.asset_contract %>)

(define-public (execute (sender principal))
  (begin 
    ;; send a message from the dao
    (try! (contract-call? '<%= it.message_contract %> send CFG_MESSAGE true))
    ;; disable an asset for deposit and withdrawal in the treasury
    (contract-call? '<%= it.treasury_contract %> allow-asset CFG_ASSET_CONTRACT false)
  )
)
