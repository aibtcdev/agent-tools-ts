(impl-trait '<%= it.proposals_trait %>)

(define-constant DAO_MANIFEST "<%= it.dao_manifest %>")

(define-public (execute (sender principal))
  (begin  
    ;; set initial dao extensions list
    (try! (contract-call? <%= it.dao_contract_address %> set-extensions
      (list
        {extension: CFG_ACTION_PROPOSALS, enabled: true}
        {extension: CFG_BANK_ACCOUNT, enabled: true}
        {extension: CFG_CORE_PROPOSALS, enabled: true}
        {extension: CFG_MESSAGING, enabled: true}
        {extension: CFG_PAYMENTS, enabled: true}
        {extension: CFG_TOKEN_OWNER, enabled: true}
        {extension: CFG_TREASURY, enabled: true}
      )
    ))
    ;; set initial action proposals list
    (try! (contract-call? <%= it.dao_contract_address %> set-extensions
      (list
        {extension: CFG_ACTION_ADD_RESOURCE, enabled: true}
        {extension: CFG_ACTION_ALLOW_ASSET, enabled: true}
        {extension: CFG_ACTION_SEND_MESSAGE, enabled: true}
        {extension: CFG_ACTION_SET_ACCOUNT_HOLDER, enabled: true}
        {extension: CFG_ACTION_SET_WITHDRAWAL_AMOUNT, enabled: true}
        {extension: CFG_ACTION_SET_WITHDRAWAL_PERIOD, enabled: true}
        {extension: CFG_ACTION_TOGGLE_RESOURCE, enabled: true}
      )
    ))
    ;; send DAO manifest as onchain message
    (try! (contract-call? <%= it.messaging_contract_address %> send DAO_MANIFEST true))
    ;; allow assets in treasury
    (try! (contract-call? <%= it.treasury_contract_address %> allow-asset CFG_TOKEN true))
    ;; print manifest
    (print DAO_MANIFEST)
    (ok true)
  )
)

(define-read-only (get-dao-manifest)
  DAO_MANIFEST
)
