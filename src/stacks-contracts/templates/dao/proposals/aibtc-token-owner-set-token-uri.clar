(impl-trait '<%= it.proposals_trait %>)

(define-public (execute (sender principal))
  ;; sets the token uri for the dao token
  (contract-call? .aibtc-token-owner set-token-uri u"https://example.com/token.json")
)
