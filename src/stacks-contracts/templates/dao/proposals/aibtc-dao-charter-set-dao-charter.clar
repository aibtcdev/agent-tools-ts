(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Set DAO Charter")
(define-constant CFG_CHARTER_TEXT "<%= it.dao_charter_text %>")
(define-constant CFG_CHARTER_INSCRIPTION_ID 0x) ;; <%= it.dao_charter_inscription_id %>
;; was CFG_CHARTER_CONTRACT .aibtc-dao-charter

(define-public (execute (sender principal))
  (begin 
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true)) ;; CFG_MESSAGE_CONTRACT
    ;; updates the charter for a dao
    (if (> (len CFG_CHARTER_INSCRIPTION_ID) u0)
      (contract-call? .aibtc-dao-charter set-dao-charter CFG_CHARTER_TEXT (some CFG_CHARTER_INSCRIPTION_ID))
      (contract-call? .aibtc-dao-charter set-dao-charter CFG_CHARTER_TEXT none)
    )
  )
)
