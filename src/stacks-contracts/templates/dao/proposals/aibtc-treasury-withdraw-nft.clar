(impl-trait '<%= it.proposals_trait %>)

(define-public (execute (sender principal))
  ;; withdraws an NFT from the treasury
  (contract-call? .aibtc-treasury withdraw-nft .aibtcdev-airdrop-1 u1 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
)
