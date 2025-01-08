(impl-trait '<%= it.proposals_trait %>)

(define-public (execute (sender principal))
  ;; adds and enables a new extension to the DAO
  (contract-call? .aibtcdev-base-dao set-extension .aibtc-bank-account true)
)
