(impl-trait <%= it.proposals_trait_v2 %>)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Initializing new bank account")
(define-constant CFG_ACCOUNT_HOLDER <%= it.account_holder %>)
(define-constant CFG_AMOUNT_TO_FUND_STX <%= it.amount_to_fund_stx %>) ;; set to 0 to skip, in microSTX
(define-constant CFG_AMOUNT_TO_FUND_FT <%= it.amount_to_fund_ft %>) ;; set to 0 to skip, in microFT

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? <%= it.message_contract %> send CFG_MESSAGE true))
    ;; set the account holder in the bank account
    (try! (contract-call? <%= it.bank_account_contract %> set-account-holder CFG_ACCOUNT_HOLDER))
    ;; enable the extension in the dao
    (try! (contract-call? <%= it.base_dao_contract %> set-extension <%= it.bank_account_contract %> true))
    ;; fund the extension from the treasury
    (and (> CFG_AMOUNT_TO_FUND_STX u0)
      (try! (contract-call? <%= it.treasury_contract %> withdraw-stx CFG_AMOUNT_TO_FUND_STX <%= it.bank_account_contract %>)))
    (and (> CFG_AMOUNT_TO_FUND_FT u0)
      (try! (contract-call? <%= it.treasury_contract %> withdraw-ft <%= it.token_contract %> CFG_AMOUNT_TO_FUND_FT <%= it.bank_account_contract %>)))
    (ok true)
  )
)
