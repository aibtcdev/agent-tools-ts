(impl-trait '<%= it.dao_proposal_trait %>)

(define-constant CFG_DAO_MANIFEST_TEXT "<%= it.dao_manifest %>")
(define-constant CFG_DAO_MANIFEST_INSCRIPTION_ID "<%= it.dao_manifest_inscription_id %>")

(define-public (execute (sender principal))
  (begin
    ;; set initial dao extensions list
    (try! (contract-call? '<%= it.base_dao_contract %> set-extensions
      (list
        {extension: '<%= it.action_proposals_contract %>, enabled: true}
        {extension: '<%= it.core_proposals_contract %>, enabled: true}
        {extension: '<%= it.dao_charter_contract %>, enabled: true}
        {extension: '<%= it.messaging_contract %>, enabled: true}
        {extension: '<%= it.payments_contract %>, enabled: true}
        {extension: '<%= it.timed_vault_contract %>, enabled: true}
        {extension: '<%= it.token_owner_contract %>, enabled: true}
        {extension: '<%= it.treasury_contract %>, enabled: true}
      )
    ))
    ;; set initial action proposals list
    (try! (contract-call? '<%= it.base_dao_contract %> set-extensions
      (list
        {extension: '<%= it.action_add_resource_contract %>, enabled: true}
        {extension: '<%= it.action_allow_asset_contract %>, enabled: true}
        {extension: '<%= it.action_send_message_contract %>, enabled: true}
        {extension: '<%= it.action_set_account_holder_contract %>, enabled: true}
        {extension: '<%= it.action_set_withdrawal_amount_contract %>, enabled: true}
        {extension: '<%= it.action_set_withdrawal_period_contract %>, enabled: true}
        {extension: '<%= it.action_toggle_resource_by_name_contract %>, enabled: true}
      )
    ))
    ;; set DAO manifest in dao-charter extension
    (try! (contract-call? '<%= it.dao_charter_contract %> set-dao-charter CFG_DAO_MANIFEST_TEXT none))
    ;; send DAO manifest as onchain message
    (try! (contract-call? '<%= it.messaging_contract %> send CFG_DAO_MANIFEST_TEXT true))
    ;; allow assets in treasury
    (try! (contract-call? '<%= it.treasury_contract %> allow-assets
      (list
        {token: '<%= it.token_contract %>, enabled: true}
        {token: '<%= it.sbtc_contract %>, enabled: true}
      )
    ))
    ;; print manifest
    (print CFG_DAO_MANIFEST_TEXT)
    (ok true)
  )
)

