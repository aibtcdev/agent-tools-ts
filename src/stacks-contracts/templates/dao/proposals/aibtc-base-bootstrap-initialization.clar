(impl-trait '<%= it.proposals_trait %>)

(define-constant DAO_MANIFEST "This is where the DAO can put it's mission, purpose, and goals.")

(define-public (execute (sender principal))
  (begin  
    ;; set initial extensions
    (try! (contract-call? '<%= it.dao_contract_address %> set-extensions
      (list
        {extension: '<%= it.actions_contract_address %>, enabled: true}
        {extension: '<%= it.bank_account_contract_address %>, enabled: true}
        {extension: '<%= it.core_proposals_contract_address %>, enabled: true}
        {extension: '<%= it.messaging_contract_address %>, enabled: true}
        {extension: '<%= it.payments_contract_address %>, enabled: true}
        {extension: '<%= it.treasury_contract_address %>, enabled: true}
      )
    ))
    ;; print manifest
    (print DAO_MANIFEST)
    (ok true)
  )
)

(define-read-only (get-dao-manifest)
  DAO_MANIFEST
)
