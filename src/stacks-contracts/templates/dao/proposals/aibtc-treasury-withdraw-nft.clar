(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Withdraw an NFT from the treasury")
(define-constant CFG_NFT_ID u1)
(define-constant CFG_RECIPIENT 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
;; was CFG_MESSAGE_CONTRACT .aibtc-onchain-messaging
;; was CFG_TREASURY_CONTRACT .aibtc-treasury
;; was CFG_NFT_CONTRACT .aibtcdev-airdrop-1

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    ;; withdraw an NFT from the treasury
    (contract-call? .aibtc-treasury withdraw-nft .aibtcdev-airdrop-1 CFG_NFT_ID CFG_RECIPIENT)
  )
)
