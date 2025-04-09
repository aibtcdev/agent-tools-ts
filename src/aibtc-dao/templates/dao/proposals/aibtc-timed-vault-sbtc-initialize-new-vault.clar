(impl-trait '<%= it.dao_proposal_trait %>)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Initialized a new BTC timed vault in the base dao and funded it from the treasury")
(define-constant CFG_ACCOUNT_HOLDER '<%= it.account_holder %>) ;; the account holder of the vault
(define-constant CFG_AMOUNT_TO_FUND_SBTC u<%= it.amount_to_fund %>) ;; set to 0 to skip, in microsBTC

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? '<%= it.messaging_contract %> send CFG_MESSAGE true))
    ;; set the account holder in the timed vault
    (try! (contract-call? '<%= it.timed_vault_contract %> set-account-holder CFG_ACCOUNT_HOLDER))
    ;; enable the extension in the dao
    (try! (contract-call? <%= it.base_dao_contract %> set-extension '<%= it.timed_vault_contract %> true))
    ;; fund the extension from the treasury
    (and (> CFG_AMOUNT_TO_FUND_SBTC u0)
      (try! (contract-call? <%= it.treasury_contract %> withdraw-ft 'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token CFG_AMOUNT_TO_FUND_SBTC '<%= it.timed_vault_contract %>)))
    (ok true)
  )
)
