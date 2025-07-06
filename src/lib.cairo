use starknet::ContractAddress;

// STRK Token Interface (ERC20)
#[starknet::interface]
trait IERC20<TContractState> {
    fn transfer(ref self: TContractState, recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(ref self: TContractState, sender: ContractAddress, recipient: ContractAddress, amount: u256) -> bool;
    fn balance_of(self: @TContractState, account: ContractAddress) -> u256;
    fn approve(ref self: TContractState, spender: ContractAddress, amount: u256) -> bool;
}

// Manual Pragma Oracle Interface (to avoid dependency conflicts)
#[derive(Drop, Serde)]
struct PragmaPricesResponse {
    price: u128,
    decimals: u32,
    last_updated_timestamp: u64,
    num_sources_aggregated: u32,
}

#[derive(Drop, Serde)]
enum DataType {
    SpotEntry: felt252,
    FutureEntry: felt252,
}

#[starknet::interface]
trait IPragmaOracle<TContractState> {
    fn get_data_median(self: @TContractState, data_type: DataType) -> PragmaPricesResponse;
}

// Rock Paper Scissors Game Interface
#[starknet::interface]
pub trait IRockPaperScissorsGame<TContractState> {
    // Player actions (perfect for session keys)
    fn join_queue(ref self: TContractState);
    fn commit_move(ref self: TContractState, game_id: u256, round: u8, move_hash: felt252);
    fn reveal_move(ref self: TContractState, game_id: u256, round: u8, move: u8, salt: felt252);
    fn claim_prize(ref self: TContractState, game_id: u256);
    
    // View functions
    fn get_required_entry_fee(self: @TContractState) -> u256;
    fn get_current_strk_price(self: @TContractState) -> u128;
    fn get_game_info(self: @TContractState, game_id: u256) -> (ContractAddress, ContractAddress, u8, u8, u8, u64, u256, ContractAddress);
    fn is_player_in_game(self: @TContractState, player: ContractAddress) -> bool;
    fn get_queue_length(self: @TContractState) -> u32;
    fn get_total_games_played(self: @TContractState) -> u256;
    
    // Admin functions
    fn withdraw_treasury(ref self: TContractState, amount: u256);
    fn set_emergency_pause(ref self: TContractState, paused: bool);
}

#[starknet::contract]
pub mod RockPaperScissorsGame {
    use starknet::ContractAddress;
    use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::{get_caller_address, get_block_timestamp, get_contract_address};
    use core::hash::HashStateTrait;
    use core::poseidon::PoseidonTrait;
    use super::{PragmaPricesResponse, DataType, IPragmaOracleDispatcher, IPragmaOracleDispatcherTrait, IERC20Dispatcher, IERC20DispatcherTrait};
    
    // Constants
    const ROCK: u8 = 1;
    const PAPER: u8 = 2;
    const SCISSORS: u8 = 3;
    const ROUNDS_TO_WIN: u8 = 3;
    const MAX_ROUNDS: u8 = 5;
    const MOVE_TIMEOUT: u64 = 60; // 1 minute in seconds
    const TREASURY_FEE_PERCENT: u8 = 25;
    
    // Game states
    const WAITING_FOR_COMMITS: u8 = 1;
    const WAITING_FOR_REVEALS: u8 = 2;
    const GAME_COMPLETE: u8 = 3;
    const FORFEITED: u8 = 4;
    
    // Oracle constants
    const STRK_USD_ASSET_ID: felt252 = 6004514686061859652; // Pragma's STRK/USD pair ID
    
    // STRK Token Contract Address (Sepolia Testnet)
    const STRK_TOKEN_ADDRESS: felt252 = 0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d;

    #[storage]
    struct Storage {
        // Core game storage
        game_counter: u256,
        total_games_played: u256,
        
        // Game info: separate maps for each field
        games_player1: Map<u256, ContractAddress>,
        games_player2: Map<u256, ContractAddress>,
        games_player1_wins: Map<u256, u8>,
        games_player2_wins: Map<u256, u8>,
        games_current_round: Map<u256, u8>,
        games_state: Map<u256, u8>,
        games_last_activity: Map<u256, u64>,
        games_prize_pool: Map<u256, u256>,
        games_winner: Map<u256, ContractAddress>,
        
        // Round info: using tuples as keys
        round_player1_hash: Map<(u256, u8), felt252>,
        round_player2_hash: Map<(u256, u8), felt252>,
        round_player1_move: Map<(u256, u8), u8>,
        round_player2_move: Map<(u256, u8), u8>,
        round_player1_revealed: Map<(u256, u8), bool>,
        round_player2_revealed: Map<(u256, u8), bool>,
        round_commit_deadline: Map<(u256, u8), u64>,
        round_reveal_deadline: Map<(u256, u8), u64>,
        
        // Player management
        player_current_game: Map<ContractAddress, u256>,
        queue_player1: ContractAddress,
        queue_player2: ContractAddress,
        queue_length: u32,
        
        // Treasury and oracle
        treasury_balance: u256,
        pragma_oracle_address: ContractAddress, // Address of Pragma Oracle contract
        strk_token_address: ContractAddress, // Address of STRK token contract
        
        // Admin controls
        owner: ContractAddress,
        emergency_paused: bool,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        PlayerJoinedQueue: PlayerJoinedQueue,
        GameStarted: GameStarted,
        MoveCommitted: MoveCommitted,
        MoveRevealed: MoveRevealed,
        RoundWon: RoundWon,
        GameWon: GameWon,
        PrizeClaimed: PrizeClaimed,
        TreasuryWithdrawal: TreasuryWithdrawal,
    }

    #[derive(Drop, starknet::Event)]
    struct PlayerJoinedQueue {
        player: ContractAddress,
        position: u32,
    }

    #[derive(Drop, starknet::Event)]
    struct GameStarted {
        game_id: u256,
        player1: ContractAddress,
        player2: ContractAddress,
        entry_fee: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct MoveCommitted {
        game_id: u256,
        player: ContractAddress,
        round: u8,
    }

    #[derive(Drop, starknet::Event)]
    struct MoveRevealed {
        game_id: u256,
        player: ContractAddress,
        round: u8,
        move: u8,
    }

    #[derive(Drop, starknet::Event)]
    struct RoundWon {
        game_id: u256,
        round: u8,
        winner: ContractAddress,
        player1_move: u8,
        player2_move: u8,
    }

    #[derive(Drop, starknet::Event)]
    struct GameWon {
        game_id: u256,
        winner: ContractAddress,
        prize_amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct PrizeClaimed {
        game_id: u256,
        winner: ContractAddress,
        amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct TreasuryWithdrawal {
        amount: u256,
        recipient: ContractAddress,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress, pragma_oracle_address: ContractAddress) {
        self.owner.write(owner);
        self.pragma_oracle_address.write(pragma_oracle_address);
        self.strk_token_address.write(STRK_TOKEN_ADDRESS.try_into().unwrap());
        self.game_counter.write(0);
        self.total_games_played.write(0);
        self.emergency_paused.write(false);
        self.queue_length.write(0);
    }

    #[abi(embed_v0)]
    impl RockPaperScissorsGameImpl of super::IRockPaperScissorsGame<ContractState> {
        
        fn join_queue(ref self: ContractState) {
            assert(!self.emergency_paused.read(), 'Game is paused');
            
            let caller = get_caller_address();
            let entry_fee = self.get_required_entry_fee();
            
            // Check if player is already in a game or queue
            assert(self.player_current_game.read(caller) == 0, 'Player already in game');
            
            // Transfer entry fee from player to contract
            let strk_token = IERC20Dispatcher { contract_address: self.strk_token_address.read() };
            let success = strk_token.transfer_from(caller, get_contract_address(), entry_fee);
            assert(success, 'Entry fee transfer failed');
            
            let queue_len = self.queue_length.read();
            
            if queue_len == 0 {
                // First player in queue
                self.queue_player1.write(caller);
                self.queue_length.write(1);
                
                self.emit(Event::PlayerJoinedQueue(
                    PlayerJoinedQueue { player: caller, position: 1 }
                ));
            } else if queue_len == 1 {
                // Second player - start game immediately
                let player1 = self.queue_player1.read();
                self.queue_player2.write(caller);
                self.queue_length.write(0); // Reset queue
                
                self.emit(Event::PlayerJoinedQueue(
                    PlayerJoinedQueue { player: caller, position: 2 }
                ));
                
                // Start the game
                self._start_game(player1, caller);
            } else {
                // Should not happen with our simple queue
                assert(false, 'Queue error');
            }
        }
        
        fn commit_move(ref self: ContractState, game_id: u256, round: u8, move_hash: felt252) {
            assert(!self.emergency_paused.read(), 'Game is paused');
            
            let caller = get_caller_address();
            let player1 = self.games_player1.read(game_id);
            let player2 = self.games_player2.read(game_id);
            let game_state = self.games_state.read(game_id);
            let current_round = self.games_current_round.read(game_id);
            
            // Validate game and round
            assert(current_round == round, 'Invalid round');
            assert(game_state == WAITING_FOR_COMMITS, 'Not in commit phase');
            assert(caller == player1 || caller == player2, 'Not a player in this game');
            assert(get_block_timestamp() <= self.round_commit_deadline.read((game_id, round)), 'Commit deadline passed');
            
            // Store the move hash
            if caller == player1 {
                assert(self.round_player1_hash.read((game_id, round)) == 0, 'Already committed');
                self.round_player1_hash.write((game_id, round), move_hash);
            } else {
                assert(self.round_player2_hash.read((game_id, round)) == 0, 'Already committed');
                self.round_player2_hash.write((game_id, round), move_hash);
            }
            
            self.emit(Event::MoveCommitted(
                MoveCommitted { game_id, player: caller, round }
            ));
            
            // Check if both players have committed
            if self.round_player1_hash.read((game_id, round)) != 0 && 
               self.round_player2_hash.read((game_id, round)) != 0 {
                self.games_state.write(game_id, WAITING_FOR_REVEALS);
                self.games_last_activity.write(game_id, get_block_timestamp());
            }
        }
        
        fn reveal_move(ref self: ContractState, game_id: u256, round: u8, move: u8, salt: felt252) {
            assert(!self.emergency_paused.read(), 'Game is paused');
            
            let caller = get_caller_address();
            let player1 = self.games_player1.read(game_id);
            let player2 = self.games_player2.read(game_id);
            let game_state = self.games_state.read(game_id);
            let current_round = self.games_current_round.read(game_id);
            
            // Validate inputs
            assert(current_round == round, 'Invalid round');
            assert(game_state == WAITING_FOR_REVEALS, 'Not in reveal phase');
            assert(caller == player1 || caller == player2, 'Not a player in this game');
            assert(move >= ROCK && move <= SCISSORS, 'Invalid move');
            assert(get_block_timestamp() <= self.round_reveal_deadline.read((game_id, round)), 'Reveal deadline passed');
            
            // Verify the commitment
            let expected_hash = self._hash_move(move, salt);
            
            if caller == player1 {
                assert(self.round_player1_hash.read((game_id, round)) == expected_hash, 'Invalid move or salt');
                assert(!self.round_player1_revealed.read((game_id, round)), 'Already revealed');
                self.round_player1_move.write((game_id, round), move);
                self.round_player1_revealed.write((game_id, round), true);
            } else {
                assert(self.round_player2_hash.read((game_id, round)) == expected_hash, 'Invalid move or salt');
                assert(!self.round_player2_revealed.read((game_id, round)), 'Already revealed');
                self.round_player2_move.write((game_id, round), move);
                self.round_player2_revealed.write((game_id, round), true);
            }
            
            self.emit(Event::MoveRevealed(
                MoveRevealed { game_id, player: caller, round, move }
            ));
            
            // Check if both players have revealed
            if self.round_player1_revealed.read((game_id, round)) && 
               self.round_player2_revealed.read((game_id, round)) {
                self._resolve_round(game_id, round);
            }
        }
        
        fn claim_prize(ref self: ContractState, game_id: u256) {
            let caller = get_caller_address();
            let winner = self.games_winner.read(game_id);
            let game_state = self.games_state.read(game_id);
            let prize_pool = self.games_prize_pool.read(game_id);
            
            assert(caller == winner, 'Not the winner');
            assert(game_state == GAME_COMPLETE || game_state == FORFEITED, 'Game not complete');
            assert(prize_pool > 0, 'Prize already claimed');
            
            let prize_amount = prize_pool * (100 - TREASURY_FEE_PERCENT.into()) / 100;
            let treasury_amount = prize_pool - prize_amount;
            
            // Update treasury
            let current_treasury = self.treasury_balance.read();
            self.treasury_balance.write(current_treasury + treasury_amount);
            
            // Mark prize as claimed
            self.games_prize_pool.write(game_id, 0);
            
            // Transfer STRK tokens to winner
            let strk_token = IERC20Dispatcher { contract_address: self.strk_token_address.read() };
            let success = strk_token.transfer(caller, prize_amount);
            assert(success, 'Prize transfer failed');
            
            self.emit(Event::PrizeClaimed(
                PrizeClaimed { game_id, winner: caller, amount: prize_amount }
            ));
        }
        
        fn get_required_entry_fee(self: @ContractState) -> u256 {
            let strk_price_usd = self._get_strk_price_from_oracle();
            
            // Calculate required STRK for $1
            // Oracle price has 8 decimals, we want $1 = 100000000 (8 decimals)
            let one_dollar_in_cents: u256 = 100000000; // $1 with 8 decimals
            let strk_decimals: u256 = 1000000000000000000; // 10^18 STRK per token
            
            // Calculate STRK needed: ($1 * 10^18) / (STRK_price_in_USD * 10^8)
            (one_dollar_in_cents * strk_decimals) / strk_price_usd.into()
        }
        
        fn get_current_strk_price(self: @ContractState) -> u128 {
            self._get_strk_price_from_oracle()
        }
        
        fn get_game_info(self: @ContractState, game_id: u256) -> (ContractAddress, ContractAddress, u8, u8, u8, u64, u256, ContractAddress) {
            (
                self.games_player1.read(game_id),
                self.games_player2.read(game_id),
                self.games_player1_wins.read(game_id),
                self.games_player2_wins.read(game_id),
                self.games_current_round.read(game_id),
                self.games_last_activity.read(game_id),
                self.games_prize_pool.read(game_id),
                self.games_winner.read(game_id)
            )
        }
        
        fn is_player_in_game(self: @ContractState, player: ContractAddress) -> bool {
            self.player_current_game.read(player) != 0
        }
        
        fn get_queue_length(self: @ContractState) -> u32 {
            self.queue_length.read()
        }
        
        fn get_total_games_played(self: @ContractState) -> u256 {
            self.total_games_played.read()
        }
        
        fn withdraw_treasury(ref self: ContractState, amount: u256) {
            let caller = get_caller_address();
            assert(caller == self.owner.read(), 'Only owner can withdraw');
            
            let current_balance = self.treasury_balance.read();
            assert(amount <= current_balance, 'Insufficient treasury balance');
            
            self.treasury_balance.write(current_balance - amount);
            
            // Transfer STRK tokens to owner
            let strk_token = IERC20Dispatcher { contract_address: self.strk_token_address.read() };
            let success = strk_token.transfer(caller, amount);
            assert(success, 'Treasury withdrawal failed');
            
            self.emit(Event::TreasuryWithdrawal(
                TreasuryWithdrawal { amount, recipient: caller }
            ));
        }
        
        fn set_emergency_pause(ref self: ContractState, paused: bool) {
            let caller = get_caller_address();
            assert(caller == self.owner.read(), 'Only owner can pause');
            self.emergency_paused.write(paused);
        }
    }

    // Internal functions
    #[generate_trait]
    impl InternalFunctions of InternalFunctionsTrait {
        fn _start_game(ref self: ContractState, player1: ContractAddress, player2: ContractAddress) {
            let game_id = self.game_counter.read() + 1;
            self.game_counter.write(game_id);
            
            // Increment total games played
            let total_games = self.total_games_played.read() + 1;
            self.total_games_played.write(total_games);
            
            let entry_fee = self.get_required_entry_fee();
            let total_prize_pool = entry_fee * 2;
            
            // Initialize game
            self.games_player1.write(game_id, player1);
            self.games_player2.write(game_id, player2);
            self.games_player1_wins.write(game_id, 0);
            self.games_player2_wins.write(game_id, 0);
            self.games_current_round.write(game_id, 1);
            self.games_state.write(game_id, WAITING_FOR_COMMITS);
            self.games_last_activity.write(game_id, get_block_timestamp());
            self.games_prize_pool.write(game_id, total_prize_pool);
            self.games_winner.write(game_id, starknet::contract_address_const::<0>());
            
            // Set player associations
            self.player_current_game.write(player1, game_id);
            self.player_current_game.write(player2, game_id);
            
            // Initialize first round timeouts
            let current_time = get_block_timestamp();
            self.round_commit_deadline.write((game_id, 1), current_time + MOVE_TIMEOUT);
            self.round_reveal_deadline.write((game_id, 1), current_time + (MOVE_TIMEOUT * 2));
            
            self.emit(Event::GameStarted(
                GameStarted { game_id, player1, player2, entry_fee }
            ));
        }
        
        fn _resolve_round(ref self: ContractState, game_id: u256, round: u8) {
            let player1 = self.games_player1.read(game_id);
            let player2 = self.games_player2.read(game_id);
            let move1 = self.round_player1_move.read((game_id, round));
            let move2 = self.round_player2_move.read((game_id, round));
            
            let winner = self._determine_round_winner(move1, move2, player1, player2);
            
            // Update wins
            let mut player1_wins = self.games_player1_wins.read(game_id);
            let mut player2_wins = self.games_player2_wins.read(game_id);
            
            if winner == player1 {
                player1_wins += 1;
                self.games_player1_wins.write(game_id, player1_wins);
            } else if winner == player2 {
                player2_wins += 1;
                self.games_player2_wins.write(game_id, player2_wins);
            }
            
            self.emit(Event::RoundWon(
                RoundWon { game_id, round, winner, player1_move: move1, player2_move: move2 }
            ));
            
            // Check if game is complete
            if player1_wins == ROUNDS_TO_WIN {
                self._complete_game(game_id, player1);
            } else if player2_wins == ROUNDS_TO_WIN {
                self._complete_game(game_id, player2);
            } else if round < MAX_ROUNDS {
                // Start next round
                let next_round = round + 1;
                self.games_current_round.write(game_id, next_round);
                self.games_state.write(game_id, WAITING_FOR_COMMITS);
                self.games_last_activity.write(game_id, get_block_timestamp());
                
                let current_time = get_block_timestamp();
                self.round_commit_deadline.write((game_id, next_round), current_time + MOVE_TIMEOUT);
                self.round_reveal_deadline.write((game_id, next_round), current_time + (MOVE_TIMEOUT * 2));
            } else {
                // Max rounds reached, determine winner by most wins
                if player1_wins > player2_wins {
                    self._complete_game(game_id, player1);
                } else {
                    self._complete_game(game_id, player2);
                }
            }
        }
        
        fn _complete_game(ref self: ContractState, game_id: u256, winner: ContractAddress) {
            let player1 = self.games_player1.read(game_id);
            let player2 = self.games_player2.read(game_id);
            let prize_pool = self.games_prize_pool.read(game_id);
            
            self.games_winner.write(game_id, winner);
            self.games_state.write(game_id, GAME_COMPLETE);
            
            // Clear player game associations
            self.player_current_game.write(player1, 0);
            self.player_current_game.write(player2, 0);
            
            self.emit(Event::GameWon(
                GameWon { game_id, winner, prize_amount: prize_pool }
            ));
        }
        
        fn _determine_round_winner(
            self: @ContractState, 
            move1: u8, 
            move2: u8, 
            player1: ContractAddress, 
            player2: ContractAddress
        ) -> ContractAddress {
            if move1 == move2 {
                // Tie
                starknet::contract_address_const::<0>()
            } else if (move1 == ROCK && move2 == SCISSORS) || 
                      (move1 == PAPER && move2 == ROCK) || 
                      (move1 == SCISSORS && move2 == PAPER) {
                player1
            } else {
                player2
            }
        }
        
        fn _hash_move(self: @ContractState, move: u8, salt: felt252) -> felt252 {
            let mut hash_state = PoseidonTrait::new();
            hash_state = hash_state.update(move.into());
            hash_state = hash_state.update(salt);
            hash_state.finalize()
        }
        
        fn _get_strk_price_from_oracle(self: @ContractState) -> u128 {
            let oracle_dispatcher = IPragmaOracleDispatcher {
                contract_address: self.pragma_oracle_address.read()
            };
            
            // Call the Pragma Oracle contract for STRK/USD spot price
            let price_response: PragmaPricesResponse = oracle_dispatcher
                .get_data_median(DataType::SpotEntry(STRK_USD_ASSET_ID));
            
            price_response.price
        }
    }
} 