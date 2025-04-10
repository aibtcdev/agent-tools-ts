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
        {extension: '<%= it.payments_dao_contract %>, enabled: true}
        {extension: '<%= it.payments_sbtc_contract %>, enabled: true}
        {extension: '<%= it.payments_stx_contract %>, enabled: true}
        ;; Timed vault DAO contracts
<% for(let i=1; i<=5; i++) { %>
        {extension: '<%= it.getNumberedContract(it.timed_vault_dao_contract, i) %>, enabled: true}
<% } %>
        ;; Timed vault SBTC contracts
<% for(let i=1; i<=5; i++) {%>
        {extension: '<%= it.getNumberedContract(it.timed_vault_sbtc_contract, i) %>, enabled: true}
<% } %>
        ;; Timed vault STX contracts
<% for(let i=1; i<=5; i++) { %>
        {extension: '<%= it.getNumberedContract(it.timed_vault_stx_contract, i) %>, enabled: true}
<% } %>        
        {extension: '<%= it.token_owner_contract %>, enabled: true}
        {extension: '<%= it.treasury_contract %>, enabled: true}
      )
    ))
    ;; set initial action proposals list
    (try! (contract-call? '<%= it.base_dao_contract %> set-extensions
      (list
        {extension: '<%= it.action_configure_timed_vault_dao_contract %>, enabled: true}
        {extension: '<%= it.action_configure_timed_vault_sbtc_contract %>, enabled: true}
        {extension: '<%= it.action_configure_timed_vault_stx_contract %>, enabled: true}
        {extension: '<%= it.action_pmt_dao_add_resource_contract %>, enabled: true}
        {extension: '<%= it.action_pmt_dao_toggle_resource_contract %>, enabled: true}
        {extension: '<%= it.action_pmt_sbtc_add_resource_contract %>, enabled: true}
        {extension: '<%= it.action_pmt_sbtc_toggle_resource_contract %>, enabled: true}
        {extension: '<%= it.action_pmt_stx_add_resource_contract %>, enabled: true}
        {extension: '<%= it.action_pmt_stx_toggle_resource_contract %>, enabled: true}
        {extension: '<%= it.action_send_message_contract %>, enabled: true}
        {extension: '<%= it.action_treasury_allow_asset_contract %>, enabled: true}
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

