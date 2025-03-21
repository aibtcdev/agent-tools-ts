(impl-trait '<%= it.dao_proposal_trait %>)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Withdrew an NFT in the treasury extension")
(define-constant CFG_STX_AMOUNT <%= it.stx_amount %>) ;; in microSTX
(define-constant CFG_RECIPIENT '<%= it.recipient %>)
(define-constant CFG_MESSAGE_CONTRACT '<%= it.message_contract %>)
(define-constant CFG_TREASURY_CONTRACT '<%= it.treasury_contract %>)

(define-public (execute (sender principal))
  (begin 
    ;; send a message from the dao
    (try! (contract-call? '<%= it.message_contract %> send CFG_MESSAGE true))
    ;; withdraw STX from the treasury
    (contract-call? '<%= it.treasury_contract %> withdraw-stx CFG_STX_AMOUNT CFG_RECIPIENT)
  )
)
