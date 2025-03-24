(impl-trait '<%= it.dao_proposal_trait %>)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Withdrew fungible tokens in the treasury extension")
(define-constant CFG_TOKEN_AMOUNT u<%= it.token_amount %>) ;; in microFT
(define-constant CFG_RECIPIENT '<%= it.recipient_address %>)
(define-constant CFG_TOKEN_CONTRACT '<%= it.token_contract %>)

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? '<%= it.message_contract %> send CFG_MESSAGE true))
    ;; withdraw fungible tokens from the treasury
    (contract-call? '<%= it.treasury_contract %> withdraw-ft CFG_TOKEN_CONTRACT CFG_TOKEN_AMOUNT CFG_RECIPIENT)
  )
)
