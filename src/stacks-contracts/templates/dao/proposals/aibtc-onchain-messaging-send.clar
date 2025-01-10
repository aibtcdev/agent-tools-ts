(impl-trait '<%= it.proposals_trait %>)

(define-public (execute (sender principal))
  ;; sends a verified message from the dao
  (contract-call? .aibtc-onchain-messaging send "hello world" true)
)
