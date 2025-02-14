(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Set DAO Charter")

(define-public (execute (sender principal))
  (begin 
    ;; send a message from the dao
    (try! (contract-call? <%= it.message_contract %> send CFG_MESSAGE true))
    ;; updates the charter for a dao
    (if (> (len <%= it.dao_charter_inscription_id %>) u0)
      (contract-call? <%= it.charter_contract %> set-dao-charter <%= it.dao_charter_text %> (some <%= it.dao_charter_inscription_id %>))
      (contract-call? <%= it.charter_contract %> set-dao-charter <%= it.dao_charter_text %> none)
    )
  )
)
