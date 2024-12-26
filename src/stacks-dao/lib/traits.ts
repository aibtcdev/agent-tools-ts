export const DAO_TRAITS = {
  EXECUTOR: {
    functions: [
      {
        args: [
          { name: "extension", type: "principal" },
          { name: "enabled", type: "bool" },
        ],
        name: "set-extension",
        access: "public",
        outputs: {
          type: { response: { ok: "bool", error: "uint128" } },
        },
      },
      {
        args: [],
        name: "get-mission",
        access: "read_only",
        outputs: {
          type: { "string-utf8": { length: 256 } },
        },
      },
    ],
  },

  BANK_ACCOUNT: {
    functions: [
      {
        args: [
          { name: "account-holder", type: { optional: "principal" } },
          { name: "withdrawal-period", type: { optional: "uint128" } },
          { name: "withdrawal-amount", type: { optional: "uint128" } },
          { name: "last-withdrawal-block", type: { optional: "uint128" } },
          { name: "opcode", type: { optional: { buffer: { length: 16 } } } },
        ],
        name: "update-terms",
        access: "public",
        outputs: {
          type: { response: { ok: "bool", error: "uint128" } },
        },
      },
      {
        args: [{ name: "amount", type: "uint128" }],
        name: "deposit-stx",
        access: "public",
        outputs: {
          type: { response: { ok: "bool", error: "uint128" } },
        },
      },
      {
        args: [],
        name: "withdraw-stx",
        access: "public",
        outputs: {
          type: { response: { ok: "bool", error: "uint128" } },
        },
      },
      {
        args: [],
        name: "get-account-balance",
        access: "read_only",
        outputs: { type: "uint128" },
      },
      {
        args: [],
        name: "get-terms",
        access: "read_only",
        outputs: {
          type: {
            tuple: [
              { name: "accountHolder", type: "principal" },
              { name: "lastWithdrawalBlock", type: "uint128" },
              { name: "withdrawalAmount", type: "uint128" },
              { name: "withdrawalPeriod", type: "uint128" },
            ],
          },
        },
      },
    ],
  },

  MESSAGING: {
    functions: [
      {
        args: [
          { name: "msg", type: { "string-ascii": { length: 1048576 } } },
          { name: "opcode", type: { optional: { buffer: { length: 16 } } } },
        ],
        name: "send",
        access: "public",
        outputs: {
          type: { response: { ok: "bool", error: "uint128" } },
        },
      },
    ],
  },

  RESOURCE_MANAGEMENT: {
    functions: [
      {
        args: [
          { name: "old-address", type: "principal" },
          { name: "new-address", type: "principal" },
        ],
        name: "set-payment-address",
        access: "public",
        outputs: {
          type: { response: { ok: "bool", error: "uint128" } },
        },
      },
      {
        args: [
          { name: "name", type: { "string-utf8": { length: 50 } } },
          { name: "description", type: { "string-utf8": { length: 255 } } },
          { name: "price", type: "uint128" },
        ],
        name: "add-resource",
        access: "public",
        outputs: {
          type: { response: { ok: "uint128", error: "uint128" } },
        },
      },
      {
        args: [{ name: "index", type: "uint128" }],
        name: "toggle-resource",
        access: "public",
        outputs: {
          type: { response: { ok: "bool", error: "uint128" } },
        },
      },
      {
        args: [{ name: "name", type: { "string-utf8": { length: 50 } } }],
        name: "toggle-resource-by-name",
        access: "public",
        outputs: {
          type: { response: { ok: "bool", error: "uint128" } },
        },
      },
    ],
  },

  INVOICE: {
    functions: [
      {
        args: [
          { name: "index", type: "uint128" },
          { name: "memo", type: { optional: { buffer: { length: 34 } } } },
        ],
        name: "pay-invoice",
        access: "public",
        outputs: {
          type: { response: { ok: "uint128", error: "uint128" } },
        },
      },
      {
        args: [
          { name: "name", type: { "string-utf8": { length: 50 } } },
          { name: "memo", type: { optional: { buffer: { length: 34 } } } },
        ],
        name: "pay-invoice-by-resource-name",
        access: "public",
        outputs: {
          type: { response: { ok: "uint128", error: "uint128" } },
        },
      },
    ],
  },

  PROPOSAL: {
    functions: [
      {
        args: [{ name: "caller", type: "principal" }],
        name: "execute",
        access: "public",
        outputs: {
          type: { response: { ok: "bool", error: "uint128" } },
        },
      },
    ],
  },

  TREASURY: {
    functions: [
      {
        args: [{ name: "amount", type: "uint128" }],
        name: "deposit-stx",
        access: "public",
        outputs: {
          type: { response: { ok: "bool", error: "uint128" } },
        },
      },
      {
        args: [
          { name: "amount", type: "uint128" },
          { name: "recipient", type: "principal" },
        ],
        name: "withdraw-stx",
        access: "public",
        outputs: {
          type: { response: { ok: "bool", error: "uint128" } },
        },
      },
      {
        args: [
          { name: "ft", type: "trait_reference" },
          { name: "amount", type: "uint128" },
        ],
        name: "deposit-ft",
        access: "public",
        outputs: {
          type: { response: { ok: "bool", error: "uint128" } },
        },
      },
      {
        args: [
          { name: "ft", type: "trait_reference" },
          { name: "amount", type: "uint128" },
          { name: "recipient", type: "principal" },
        ],
        name: "withdraw-ft",
        access: "public",
        outputs: {
          type: { response: { ok: "bool", error: "uint128" } },
        },
      },
      {
        args: [
          { name: "nft", type: "trait_reference" },
          { name: "id", type: "uint128" },
        ],
        name: "deposit-nft",
        access: "public",
        outputs: {
          type: { response: { ok: "bool", error: "uint128" } },
        },
      },
      {
        args: [
          { name: "nft", type: "trait_reference" },
          { name: "id", type: "uint128" },
          { name: "recipient", type: "principal" },
        ],
        name: "withdraw-nft",
        access: "public",
        outputs: {
          type: { response: { ok: "bool", error: "uint128" } },
        },
      },
    ],
  },
};
