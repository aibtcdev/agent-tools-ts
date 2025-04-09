(impl-trait '<%= it.dao_proposal_trait %>)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Initialized a new STX timed vault in the base dao and funded it from the treasury")
(define-constant CFG_ACCOUNT_HOLDER '<%= it.account_holder %>) ;; the account holder of the vault
(define-constant CFG_AMOUNT_TO_FUND_STX u<%= it.amount_to_fund_stx %>) ;; set to 0 to skip, in microSTX
(define-constant CFG_AMOUNT_TO_FUND_FT u<%= it.amount_to_fund_ft %>) ;; set to 0 to skip, in microFT

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? '<%= it.messaging_contract %> send CFG_MESSAGE true)) ;; CFG_MESSAGE_CONTRACT
    ;; set the account holder in the timed vault
    (try! (contract-call? '<%= it.timed_vault_contract %> set-account-holder CFG_ACCOUNT_HOLDER)) ;; CFG_NEW_TIMED_VAULT_CONTRACT
    ;; enable the extension in the dao
    (try! (contract-call? <%= it.base_dao_contract %> set-extension '<%= it.timed_vault_contract %> true)) ;; CFG_BASE_DAO, CFG_NEW_TIMED_VAULT_CONTRACT
    ;; fund the extension from the treasury
    (and (> CFG_AMOUNT_TO_FUND_STX u0)
      (try! (contract-call? <%= it.treasury_contract %> withdraw-stx CFG_AMOUNT_TO_FUND_STX '<%= it.timed_vault_contract %>))) ;; CFG_TREASURY_CONTRACT, CFG_NEW_TIMED_VAULT_CONTRACT
    (and (> CFG_AMOUNT_TO_FUND_FT u0)
      (try! (contract-call? <%= it.treasury_contract %> withdraw-ft '<%= it.token_contract %>-token CFG_AMOUNT_TO_FUND_FT '<%= it.timed_vault_contract %>))) ;; CFG_TREASURY_CONTRACT, CFG_TOKEN_CONTRACT, CFG_NEW_TIMED_VAULT_CONTRACT
    (ok true)
  )
)
