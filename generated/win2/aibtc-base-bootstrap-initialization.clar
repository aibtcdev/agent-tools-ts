
(impl-trait 'ST3VXT52QEQPZ5246A16RFNMR1PRJ96JK6YYX37N8.aibtcdev-dao-traits-v1.proposal)

(define-constant DAO_MANIFEST "This is where the dao manifest would go")

(define-public (execute (sender principal))
  (begin  
    ;; set initial extensions
    (try! (contract-call? 'ST1TZE9ZY61FYR7YM9BR0543XKX9YG5TR9017R4WJ.win2-base-dao set-extensions
      (list
        {extension: 'ST1TZE9ZY61FYR7YM9BR0543XKX9YG5TR9017R4WJ.win2-action-proposals, enabled: true}
        {extension: 'ST1TZE9ZY61FYR7YM9BR0543XKX9YG5TR9017R4WJ.win2-bank-account, enabled: true}
        {extension: 'ST1TZE9ZY61FYR7YM9BR0543XKX9YG5TR9017R4WJ.win2-core-proposals, enabled: true}
        {extension: 'ST1TZE9ZY61FYR7YM9BR0543XKX9YG5TR9017R4WJ.win2-onchain-messaging, enabled: true}
        {extension: 'ST1TZE9ZY61FYR7YM9BR0543XKX9YG5TR9017R4WJ.win2-payments-invoices, enabled: true}
        {extension: 'ST1TZE9ZY61FYR7YM9BR0543XKX9YG5TR9017R4WJ.win2-token-owner, enabled: true}
        {extension: 'ST1TZE9ZY61FYR7YM9BR0543XKX9YG5TR9017R4WJ.win2-treasury, enabled: true}
      )
    ))
    ;; print manifest
    (print DAO_MANIFEST)
    (ok true)
  )
)

(define-read-only (get-dao-manifest)
  DAO_MANIFEST
)

