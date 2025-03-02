(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Deposit NFT to the treasury")
(define-constant CFG_NFT_ID <%= it.nft_id %>)
(define-constant CFG_MESSAGE_CONTRACT <%= it.message_contract %>)
(define-constant CFG_TREASURY_CONTRACT <%= it.treasury_contract %>)
(define-constant CFG_NFT_CONTRACT <%= it.nft_contract %>)

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? <%= it.message_contract %> send CFG_MESSAGE true))
    ;; deposit NFT to the treasury
    (contract-call? <%= it.treasury_contract %> deposit-nft <%= it.nft_contract %> CFG_NFT_ID)
  )
)
