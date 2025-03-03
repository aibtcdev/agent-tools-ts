# aibtc-dao tools

## Creating a new DAO

- `generate-dao.ts` will create the contracts and return their information in a structured format, with an option to save to the `./generated` folder of the project
- `deploy-dao.ts` will create the contracts, deploy them to testnet, then return their information in a structured format, with an option to save to the `./generated` folder of the project
- `construct-dao.ts` will send the required transaction to create and instantiate the DAO, enabling all related extensions and starting operation

### V2 DAO traits

The latest version has new traits to simplify things, deployed here on testnet:

- [aibtc-dao-traits-v2](https://explorer.hiro.so/txid/ST3YT0XW92E6T2FE59B2G5N2WNNFSBZ6MZKQS5D18.aibtc-dao-traits-v2?chain=testnet)
- [aibtc-dao-v2](https://explorer.hiro.so/txid/ST3YT0XW92E6T2FE59B2G5N2WNNFSBZ6MZKQS5D18.aibtc-dao-v2?chain=testnet)

### Example with scripts

Generate and deploy the 20 DAO contracts

```
Usage: bun run deploy-dao.ts <tokenSymbol> <tokenName> <tokenMaxSupply> <tokenUri> <logoUrl> <originAddress> <daoManifest> <tweetOrigin> <daoManifestInscriptionId> <generateFiles>

bun run src/stacks-contracts/deploy-dao.ts LFG4 GoTimeTest 1000000000 https://aibtc.dev https://aibtc.dev ST3YT0XW92E6T2FE59B2G5N2WNNFSBZ6MZKQS5D18 "Ze Manifesto" "1234" "dao manifest inscription id" true
```

Construct the dao with bootstrap proposal
[example](https://explorer.hiro.so/txid/0x9467fbb7c1ce5dfdaef9ac99e35a8f4ab10c82e56dd527911b46f484817ef67c?chain=testnet)

```
Usage: bun run construct-dao.ts <baseDaoContract> <proposalContract>

bun run src/aibtc-dao/construct-dao.ts ST3YT0XW92E6T2FE59B2G5N2WNNFSBZ6MZKQS5D18.lfg4-base-dao ST3YT0XW92E6T2FE59B2G5N2WNNFSBZ6MZKQS5D18.lfg4-base-bootstrap-initialization-v2
```

## Interacting with a DAO

All tools for working with a DAO are in the `base-dao` and `extensions` folder to start, organized by the associated contract.

Any public functions require creating a TX and making a contract call. Read-only functions can be called by any sender.

If there is a protected function that requires the DAO context then it cannot be called directly. Any DAO decisions require either an action or core proposal.

## Submitting Proposals

Proposals can only be submitted by token holders, so first we have to buy from the DEX:

Buy token from bonding curve
[example](https://explorer.hiro.so/txid/0x994906d2202d1f65df270df43e9564b8bdd12b953565d3fcb92ba853e9813bc4?chain=testnet)

```
Usage: bun run exec-buy.ts <stxAmount> <dexContract> [slippage]

bun run src/stacks-faktory/exec-buy.ts 100 ST3YT0XW92E6T2FE59B2G5N2WNNFSBZ6MZKQS5D18.lfg4-faktory-dex
```

Then we can submit an action proposal based on our deployed options, starting with the example below for a signed message.
[example](https://explorer.hiro.so/txid/0xd32f91ecaf6336a9318da69e06e0ee14f0a8787722334a89e5f9fdc43c31815a?chain=testnet)

```
Usage: bun run propose-action-send-message.ts <daoActionProposalsExtensionContract> <daoActionProposalContract> <message>

bun run src/aibtc-dao/extensions/action-proposals/public/propose-action-send-message.ts ST3YT0XW92E6T2FE59B2G5N2WNNFSBZ6MZKQS5D18.lfg4-action-proposals-v2 ST3YT0XW92E6T2FE59B2G5N2WNNFSBZ6MZKQS5D18.lfg4-action-send-message "well hello there"
```

Vote on action proposal, voting happens based on the snapshot of the balance at the block height the proposal was created.
[example](https://explorer.hiro.so/txid/0xa8ab22b1f74ff3d709de4c930b512b56c32fd6592adebfc2960aca292048ae0a?chain=testnet)

```
Usage: bun run vote-on-proposal.ts <daoActionProposalsExtensionContract> <proposalId> <vote>

bun run src/aibtc-dao/extensions/action-proposals/public/vote-on-proposal.ts ST3YT0XW92E6T2FE59B2G5N2WNNFSBZ6MZKQS5D18.lfg4-action-proposals-v2 1 true
```

Conclude action proposal (in this case, sends message from dao)
[example](https://explorer.hiro.so/txid/0x1cbf0d4f15a63d5cf54918a6948d2a687541cffb4f88517c59b5dfb7f62f27e2?chain=testnet)

```
Usage: bun run conclude-proposal.ts <daoActionProposalsExtensionContract> <proposalId> <daoActionProposalContract>

bun run src/aibtc-dao/extensions/action-proposals/public/conclude-proposal.ts ST3YT0XW92E6T2FE59B2G5N2WNNFSBZ6MZKQS5D18.lfg4-action-proposals-v2 1 ST3YT0XW92E6T2FE59B2G5N2WNNFSBZ6MZKQS5D18.lfg4-action-send-message
```

Proposals can be concluded by anyone and should always conclude with a successful transaction.

If the proposal criteria is met the proposal code will run.
