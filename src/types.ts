// define types of networks we allow
// matches string definitions in Stacks.js
export type NetworkType = "mainnet" | "testnet" | "devnet" | "mocknet";

// define structure of app config
export interface AppConfig {
  NETWORK: NetworkType;
  MNEMONIC: string;
  ACCOUNT_INDEX: number;
}

// TODO: can we get this from API types?
export type NamesDataResponse = {
  address: string;
  blockchain: string;
  expire_block?: number;
  grace_period?: number;
  last_txid?: string;
  resolver?: string;
  status?: string;
  zonefile?: string;
  zonefile_hash?: string;
};

// TODO: can we get this from API types?
export type Epoch = {
  epoch_id: string;
  start_height: number;
  end_height: number;
  block_limit: {
    write_length: number;
    write_count: number;
    read_length: number;
    read_count: number;
    runtime: number;
  };
  network_epoch: number;
};

// TODO: can we get this from API types?
export type RewardCycle = {
  id: number;
  min_threshold_ustx: number;
  stacked_ustx: number;
  is_pox_active: boolean;
};

// TODO: can we get this from API types?
export type NextCycle = {
  id: number;
  min_threshold_ustx: number;
  min_increment_ustx: number;
  stacked_ustx: number;
  prepare_phase_start_block_height: number;
  blocks_until_prepare_phase: number;
  reward_phase_start_block_height: number;
  blocks_until_reward_phase: number;
  ustx_until_pox_rejection: number | null;
};

// TODO: can we get this from API types?
export type ContractVersion = {
  contract_id: string;
  activation_burnchain_block_height: number;
  first_reward_cycle_id: number;
};

// same as CoreRpcPoxInfo? how do we import?
// https://github.com/hirosystems/stacks-blockchain-api/blob/054004e55c25b92cd5cdf255781b795a6404318b/src/core-rpc/client.ts#L36
export type POXResponse = {
  contract_id: string;
  pox_activation_threshold_ustx: number;
  first_burnchain_block_height: number;
  current_burnchain_block_height: number;
  prepare_phase_block_length: number;
  reward_phase_block_length: number;
  reward_slots: number;
  rejection_fraction: number | null;
  total_liquid_supply_ustx: number;
  current_cycle: RewardCycle;
  next_cycle: NextCycle;
  epochs: Epoch[];
  min_amount_ustx: number;
  prepare_cycle_length: number;
  reward_cycle_id: number;
  reward_cycle_length: number;
  rejection_votes_left_required: number | null;
  next_reward_cycle_in: number;
  contract_versions: ContractVersion[];
};

// TODO: can we get this from API types?
export interface TransactionResponse {
  limit: number;
  offset: number;
  total: number;
  results: Array<{
    tx: {
      tx_id: string;
      nonce: number;
      fee_rate: string;
      sender_address: string;
      sponsor_nonce: number;
      sponsored: boolean;
      sponsor_address: string;
      post_condition_mode: string;
      post_conditions: Array<{
        principal: {
          type_id: string;
        };
        condition_code: string;
        amount: string;
        type: string;
      }>;
      anchor_mode: string;
      block_hash: string;
      block_height: number;
      block_time: number;
      block_time_iso: string;
      burn_block_height: number;
      burn_block_time: number;
      burn_block_time_iso: string;
      parent_burn_block_time: number;
      parent_burn_block_time_iso: string;
      canonical: boolean;
      tx_index: number;
      tx_status: string;
      tx_result: {
        hex: string;
        repr: string;
      };
      event_count: number;
      parent_block_hash: string;
      is_unanchored: boolean;
      microblock_hash: string;
      microblock_sequence: number;
      microblock_canonical: boolean;
      execution_cost_read_count: number;
      execution_cost_read_length: number;
      execution_cost_runtime: number;
      execution_cost_write_count: number;
      execution_cost_write_length: number;
      events: Array<{
        event_index: number;
        event_type: string;
        tx_id: string;
        contract_log: {
          contract_id: string;
          topic: string;
          value: {
            hex: string;
            repr: string;
          };
        };
      }>;
      tx_type: string;
      contract_call: {
        contract_id: string;
        function_name: string;
      };
      smart_contract: {
        contract_id: string;
      };
      token_transfer: {
        recipient_address: string;
        amount: string;
        memo: string;
      };
    };
    stx_sent: string;
    stx_received: string;
    events: {
      stx: {
        transfer: number;
        mint: number;
        burn: number;
      };
      ft: {
        transfer: number;
        mint: number;
        burn: number;
      };
      nft: {
        transfer: number;
        mint: number;
        burn: number;
      };
    };
  }>;
}
