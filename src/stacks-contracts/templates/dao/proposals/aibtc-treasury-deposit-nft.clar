(impl-trait '<%= it.proposals_trait %>)

(define-public (execute (sender principal))
  ;; deposits an NFT to the treasury
  (contract-call? .aibtc-treasury deposit-nft .aibtcdev-airdrop-1 u1)
)
