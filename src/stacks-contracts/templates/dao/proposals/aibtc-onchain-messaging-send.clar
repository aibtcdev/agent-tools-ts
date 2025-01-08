(impl-trait .aibtcdev-dao-traits-v1.proposal)

(define-public (execute (sender principal))
  ;; sends a verified message from the dao
  (contract-call? .aibtc-onchain-messaging send "hello world" true)
)
