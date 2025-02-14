(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Deposit NFT to the treasury")
(define-constant CFG_NFT_ID u1)
;; was CFG_MESSAGE_CONTRACT .aibtc-onchain-messaging
;; was CFG_TREASURY_CONTRACT .aibtc-treasury
;; was CFG_NFT_CONTRACT .aibtcdev-airdrop-1

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    ;; deposit NFT to the treasury
    (contract-call? .aibtc-treasury deposit-nft .aibtcdev-airdrop-1 CFG_NFT_ID)
  )
)
