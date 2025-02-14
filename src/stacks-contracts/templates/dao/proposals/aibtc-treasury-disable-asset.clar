(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Disable an asset for deposit and withdrawal in the treasury")
(define-constant CFG_ASSET_CONTRACT 'SP3D6PV2ACBPEKYJTCMH7HEN02KP87QSP8KTEH335.abtc)
;; was CFG_MESSAGE_CONTRACT .aibtc-onchain-messaging
;; was CFG_TREASURY_CONTRACT .aibtc-treasury

(define-public (execute (sender principal))
  (begin 
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    ;; disable an asset for deposit and withdrawal in the treasury
    (contract-call? .aibtc-treasury allow-asset CFG_ASSET_CONTRACT false)
  )
)
