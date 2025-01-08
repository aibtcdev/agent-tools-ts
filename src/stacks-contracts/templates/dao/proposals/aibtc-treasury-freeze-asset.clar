(impl-trait .aibtcdev-dao-traits-v1.proposal)

(define-public (execute (sender principal))
  ;; disables an asset for deposit and withdrawal in the treasury
  (contract-call? .aibtc-treasury allow-asset 'SP3D6PV2ACBPEKYJTCMH7HEN02KP87QSP8KTEH335.abtc false)
)
