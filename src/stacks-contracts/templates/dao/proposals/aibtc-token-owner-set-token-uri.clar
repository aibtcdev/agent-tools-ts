(impl-trait .aibtc-dao-traits-v2.proposal)

;; template vars
;;
(define-constant CFG_MESSAGE "Executed Core Proposal: Set token uri for dao token")
(define-constant CFG_TOKEN_URI u"https://example.com/token.json")
;; was CFG_MESSAGE_CONTRACT .aibtc-onchain-messaging
;; was CFG_TOKEN_OWNER_CONTRACT .aibtc-token-owner

(define-public (execute (sender principal))
  (begin
    ;; send a message from the dao
    (try! (contract-call? .aibtc-onchain-messaging send CFG_MESSAGE true))
    ;; set token uri in the token owner contract
    (contract-call? .aibtc-token-owner set-token-uri CFG_TOKEN_URI)
  )
)
