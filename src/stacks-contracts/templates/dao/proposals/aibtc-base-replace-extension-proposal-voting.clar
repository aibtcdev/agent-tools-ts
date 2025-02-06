(impl-trait .aibtcdev-dao-traits-v1.proposal)

(define-constant ERR_EXTENSION_NOT_FOUND (err u3003))

(define-public (execute (sender principal))
  ;; replaces the core and action voting proposals in a dao
  (begin
    ;; check that old extensions exist
    (asserts! (contract-call? .aibtcdev-base-dao is-extension '<%= it.action_proposals_contract_address %>) ERR_EXTENSION_NOT_FOUND)
    (asserts! (contract-call? .aibtcdev-base-dao is-extension '<%= it.core_proposals_contract_address %>) ERR_EXTENSION_NOT_FOUND)
    ;; disable old extensions
    (try! (contract-call? .aibtcdev-base-dao set-extension '<%= it.action_proposals_contract_address %> false))
    (try! (contract-call? .aibtcdev-base-dao set-extension '<%= it.core_proposals_contract_address %> false))
    ;; add new extensions
    (try! (contract-call? .aibtcdev-base-dao set-extension '<%= it.action_proposals_v2_contract_address %> true))
    (try! (contract-call? .aibtcdev-base-dao set-extension '<%= it.core_proposals_v2_contract_address %> true))
    (ok true)
  )
)
