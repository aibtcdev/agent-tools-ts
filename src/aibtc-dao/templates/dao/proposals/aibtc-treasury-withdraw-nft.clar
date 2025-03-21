(impl-trait '<%= it.dao_proposal_trait %>)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Withdrew an NFT in the treasury extension")
(define-constant CFG_NFT_ID <%= it.nft_id %>)
(define-constant CFG_RECIPIENT '<%= it.recipient %>)
(define-constant CFG_MESSAGE_CONTRACT '<%= it.message_contract %>)
(define-constant CFG_TREASURY_CONTRACT '<%= it.treasury_contract %>)
(define-constant CFG_NFT_CONTRACT '<%= it.nft_contract %>)

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? '<%= it.message_contract %> send CFG_MESSAGE true))
    ;; withdraw an NFT from the treasury
    (contract-call? '<%= it.treasury_contract %> withdraw-nft CFG_NFT_CONTRACT CFG_NFT_ID CFG_RECIPIENT)
  )
)
