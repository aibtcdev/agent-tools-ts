(impl-trait '<%= it.proposals_trait %>)

(define-constant DAO_MANIFEST "<%= it.dao_manifest %>")

(define-public (execute (sender principal))
  (begin  
    ;; set initial dao extensions list
    (try! (contract-call? '<%= it.dao_contract_address %> set-extensions
      (list
        {extension: '<%= it.action_proposals_v2_contract_address %>, enabled: true}
        {extension: '<%= it.bank_account_contract_address %>, enabled: true}
        {extension: '<%= it.core_proposals_v2_contract_address %>, enabled: true}
        {extension: '<%= it.messaging_contract_address %>, enabled: true}
        {extension: '<%= it.payments_contract_address %>, enabled: true}
        {extension: '<%= it.token_owner_contract_address %>, enabled: true}
        {extension: '<%= it.treasury_contract_address %>, enabled: true}
      )
    ))
    ;; set initial action proposals list
    (try! (contract-call? '<%= it.dao_contract_address %> set-extensions
      (list
        {extension: '<%= it.action_add_resource_contract_address %>, enabled: true}
        {extension: '<%= it.action_allow_asset_contract_address %>, enabled: true}
        {extension: '<%= it.action_send_message_contract_address %>, enabled: true}
        {extension: '<%= it.action_set_account_holder_contract_address %>, enabled: true}
        {extension: '<%= it.action_set_withdrawal_amount_contract_address %>, enabled: true}
        {extension: '<%= it.action_set_withdrawal_period_contract_address %>, enabled: true}
        {extension: '<%= it.action_toggle_resource_by_name_contract_address %>, enabled: true}
      )
    ))
    ;; send DAO manifest as onchain message
    (try! (contract-call? '<%= it.messaging_contract_address %> send DAO_MANIFEST true))
    ;; allow assets in treasury
    (try! (contract-call? '<%= it.treasury_contract_address %> allow-asset '<%= it.token_contract_address %> true))
    ;; print manifest
    (print DAO_MANIFEST)
    (ok true)
  )
)

(define-read-only (get-dao-manifest)
  DAO_MANIFEST
)
