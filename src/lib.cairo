use starknet::ContractAddress;

mod components;

use components::{
    Game, Round, Player, Queue, GlobalState,
    ROCK, PAPER, SCISSORS, 
    WAITING_FOR_COMMITS, WAITING_FOR_REVEALS, GAME_COMPLETE, FORFEITED,
    ROUNDS_TO_WIN, MAX_ROUNDS, MOVE_TIMEOUT, TREASURY_FEE_PERCENT,
    STRK_USD_ASSET_ID, STRK_TOKEN_ADDRESS
};

// STRK Token Interface (ERC20)
#[starknet::interface]
trait IERC20<TContractState> {
    fn transfer(ref self: TContractState, recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(ref self: TContractState, sender: ContractAddress, recipient: ContractAddress, amount: u256) -> bool;
    fn balance_of(self: @TContractState, account: ContractAddress) -> u256;
    fn approve(ref self: TContractState, spender: ContractAddress, amount: u256) -> bool;
}

// Pragma Oracle Interface
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
    // Player actions
    fn join_queue(ref self: TContractState);
    fn commit_move(ref self: TContractState, game_id: u256, round: u8, move_hash: felt252);
    fn reveal_move(ref self: TContractState, game_id: u256, round: u8, move: u8, salt: felt252);
    fn claim_prize(ref self: TContractState, game_id: u256);
    
    // View functions
    fn get_required_entry_fee(self: @TContractState) -> u256;
    fn get_current_strk_price(self: @TContractState) -> u128;
    fn get_game_info(self: @TContractState, game_id: u256) -> Game;
    fn is_player_in_game(self: @TContractState, player: ContractAddress) -> bool;
    fn get_queue_length(self: @TContractState) -> u32;
    fn get_total_games_played(self: @TContractState) -> u256;
    
    // Admin functions
    fn withdraw_treasury(ref self: TContractState, amount: u256);
    fn set_emergency_pause(ref self: TContractState, paused: bool);
}

#[starknet::contract]
pub mod RockPaperScissorsGame {
    use super::{
        Game, Round, Player, Queue, GlobalState,
        ROCK, PAPER, SCISSORS, 
        WAITING_FOR_COMMITS, WAITING_FOR_REVEALS, GAME_COMPLETE, FORFEITED,
        ROUNDS_TO_WIN, MAX_ROUNDS, MOVE_TIMEOUT, TREASURY_FEE_PERCENT,
        STRK_USD_ASSET_ID, STRK_TOKEN_ADDRESS,
        IERC20Dispatcher, IERC20DispatcherTrait,
        IPragmaOracleDispatcher, IPragmaOracleDispatcherTrait,
        PragmaPricesResponse, DataType
    };
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp, get_contract_address};
    use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess, StoragePointerWriteAccess};
    use core::hash::HashStateTrait;
    use core::poseidon::PoseidonTrait;

    #[storage]
    struct Storage {
        // ECS-like storage using maps
        games: Map<u256, Game>,
        rounds: Map<(u256, u8), Round>,
        players: Map<ContractAddress, Player>,
        queue: Queue,
        global_state: GlobalState,
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
        let strk_token_address: ContractAddress = STRK_TOKEN_ADDRESS.try_into().unwrap();
        
        let global_state = GlobalState {
            id: 1,
            game_counter: 0,
            total_games_played: 0,
            treasury_balance: 0,
            pragma_oracle_address,
            strk_token_address,
            owner,
            emergency_paused: false,
        };
        
        let queue = Queue {
            id: 1,
            player1: starknet::contract_address_const::<0>(),
            player2: starknet::contract_address_const::<0>(),
            length: 0,
        };
        
        self.global_state.write(global_state);
        self.queue.write(queue);
    }

    #[abi(embed_v0)]
    impl RockPaperScissorsGameImpl of super::IRockPaperScissorsGame<ContractState> {
        
        fn join_queue(ref self: ContractState) {
            let global_state = self.global_state.read();
            assert(!global_state.emergency_paused, 'Game is paused');
            
            let caller = get_caller_address();
            let entry_fee = self.get_required_entry_fee();
            
            // Check if player is already in a game
            let player = self.players.read(caller);
            assert(player.current_game == 0, 'Player already in game');
            
            // Transfer entry fee from player to contract
            let strk_token = IERC20Dispatcher { contract_address: global_state.strk_token_address };
            let success = strk_token.transfer_from(caller, get_contract_address(), entry_fee);
            assert(success, 'Entry fee transfer failed');
            
            let mut queue = self.queue.read();
            
            if queue.length == 0 {
                // First player in queue
                queue.player1 = caller;
                queue.length = 1;
                self.queue.write(queue);
                
                self.emit(Event::PlayerJoinedQueue(
                    PlayerJoinedQueue { player: caller, position: 1 }
                ));
            } else if queue.length == 1 {
                // Second player - start game immediately
                let player1 = queue.player1;
                queue.player2 = caller;
                queue.length = 0; // Reset queue
                self.queue.write(queue);
                
                self.emit(Event::PlayerJoinedQueue(
                    PlayerJoinedQueue { player: caller, position: 2 }
                ));
                
                // Start the game
                self._start_game(player1, caller);
            } else {
                assert(false, 'Queue error');
            }
        }
        
        fn commit_move(ref self: ContractState, game_id: u256, round: u8, move_hash: felt252) {
            let global_state = self.global_state.read();
            assert(!global_state.emergency_paused, 'Game is paused');
            
            let caller = get_caller_address();
            let game = self.games.read(game_id);
            let mut round_data = self.rounds.read((game_id, round));
            
            // Validate game and round
            assert(round == game.current_round, 'Invalid round');
            assert(game.state == WAITING_FOR_COMMITS, 'Not in commit phase');
            assert(caller == game.player1 || caller == game.player2, 'Not a player in this game');
            assert(get_block_timestamp() <= round_data.commit_deadline, 'Commit deadline passed');
            
            // Store the move hash
            if caller == game.player1 {
                assert(round_data.player1_hash == 0, 'Already committed');
                round_data.player1_hash = move_hash;
            } else {
                assert(round_data.player2_hash == 0, 'Already committed');
                round_data.player2_hash = move_hash;
            }
            
            self.rounds.write((game_id, round), round_data);
            
            self.emit(Event::MoveCommitted(
                MoveCommitted { game_id, player: caller, round }
            ));
            
            // Check if both players have committed
            let updated_round = self.rounds.read((game_id, round));
            if updated_round.player1_hash != 0 && updated_round.player2_hash != 0 {
                let mut updated_game = game;
                updated_game.state = WAITING_FOR_REVEALS;
                updated_game.last_activity = get_block_timestamp();
                self.games.write(game_id, updated_game);
            }
        }
        
        fn reveal_move(ref self: ContractState, game_id: u256, round: u8, move: u8, salt: felt252) {
            let global_state = self.global_state.read();
            assert(!global_state.emergency_paused, 'Game is paused');
            
            let caller = get_caller_address();
            let game = self.games.read(game_id);
            let mut round_data = self.rounds.read((game_id, round));
            
            // Validate inputs
            assert(round == game.current_round, 'Invalid round');
            assert(game.state == WAITING_FOR_REVEALS, 'Not in reveal phase');
            assert(caller == game.player1 || caller == game.player2, 'Not a player in this game');
            assert(move >= ROCK && move <= SCISSORS, 'Invalid move');
            assert(get_block_timestamp() <= round_data.reveal_deadline, 'Reveal deadline passed');
            
            // Verify the commitment
            let expected_hash = self._hash_move(move, salt);
            
            if caller == game.player1 {
                assert(round_data.player1_hash == expected_hash, 'Invalid move or salt');
                assert(!round_data.player1_revealed, 'Already revealed');
                round_data.player1_move = move;
                round_data.player1_revealed = true;
            } else {
                assert(round_data.player2_hash == expected_hash, 'Invalid move or salt');
                assert(!round_data.player2_revealed, 'Already revealed');
                round_data.player2_move = move;
                round_data.player2_revealed = true;
            }
            
            self.rounds.write((game_id, round), round_data);
            
            self.emit(Event::MoveRevealed(
                MoveRevealed { game_id, player: caller, round, move }
            ));
            
            // Check if both players have revealed
            let updated_round = self.rounds.read((game_id, round));
            if updated_round.player1_revealed && updated_round.player2_revealed {
                self._resolve_round(game_id, round);
            }
        }
        
        fn claim_prize(ref self: ContractState, game_id: u256) {
            let caller = get_caller_address();
            let mut game = self.games.read(game_id);
            
            assert(caller == game.winner, 'Not the winner');
            assert(game.state == GAME_COMPLETE || game.state == FORFEITED, 'Game not complete');
            assert(game.prize_pool > 0, 'Prize already claimed');
            
            let prize_amount = game.prize_pool * (100 - TREASURY_FEE_PERCENT.into()) / 100;
            let treasury_amount = game.prize_pool - prize_amount;
            
            // Update treasury
            let mut global_state = self.global_state.read();
            global_state.treasury_balance += treasury_amount;
            self.global_state.write(global_state);
            
            // Mark prize as claimed
            game.prize_pool = 0;
            self.games.write(game_id, game);
            
            // Transfer STRK tokens to winner
            let strk_token = IERC20Dispatcher { contract_address: global_state.strk_token_address };
            let success = strk_token.transfer(caller, prize_amount);
            assert(success, 'Prize transfer failed');
            
            self.emit(Event::PrizeClaimed(
                PrizeClaimed { game_id, winner: caller, amount: prize_amount }
            ));
        }
        
        fn get_required_entry_fee(self: @ContractState) -> u256 {
            let strk_price_usd = self._get_strk_price_from_oracle();
            
            // Calculate required STRK for $1
            let one_dollar_in_cents: u256 = 100000000; // $1 with 8 decimals
            let strk_decimals: u256 = 1000000000000000000; // 10^18 STRK per token
            
            (one_dollar_in_cents * strk_decimals) / strk_price_usd.into()
        }
        
        fn get_current_strk_price(self: @ContractState) -> u128 {
            self._get_strk_price_from_oracle()
        }
        
        fn get_game_info(self: @ContractState, game_id: u256) -> Game {
            self.games.read(game_id)
        }
        
        fn is_player_in_game(self: @ContractState, player: ContractAddress) -> bool {
            let player_data = self.players.read(player);
            player_data.current_game != 0
        }
        
        fn get_queue_length(self: @ContractState) -> u32 {
            let queue = self.queue.read();
            queue.length
        }
        
        fn get_total_games_played(self: @ContractState) -> u256 {
            let global_state = self.global_state.read();
            global_state.total_games_played
        }
        
        fn withdraw_treasury(ref self: ContractState, amount: u256) {
            let caller = get_caller_address();
            let mut global_state = self.global_state.read();
            assert(caller == global_state.owner, 'Only owner can withdraw');
            assert(amount <= global_state.treasury_balance, 'Insufficient treasury balance');
            
            global_state.treasury_balance -= amount;
            self.global_state.write(global_state);
            
            // Transfer STRK tokens to owner
            let strk_token = IERC20Dispatcher { contract_address: global_state.strk_token_address };
            let success = strk_token.transfer(caller, amount);
            assert(success, 'Treasury withdrawal failed');
            
            self.emit(Event::TreasuryWithdrawal(
                TreasuryWithdrawal { amount, recipient: caller }
            ));
        }
        
        fn set_emergency_pause(ref self: ContractState, paused: bool) {
            let caller = get_caller_address();
            let mut global_state = self.global_state.read();
            assert(caller == global_state.owner, 'Only owner can pause');
            global_state.emergency_paused = paused;
            self.global_state.write(global_state);
        }
    }

    // Internal functions
    #[generate_trait]
    impl InternalFunctions of InternalFunctionsTrait {
        fn _start_game(ref self: ContractState, player1: ContractAddress, player2: ContractAddress) {
            let mut global_state = self.global_state.read();
            let game_id = global_state.game_counter + 1;
            global_state.game_counter = game_id;
            global_state.total_games_played += 1;
            self.global_state.write(global_state);
            
            let entry_fee = self.get_required_entry_fee();
            let total_prize_pool = entry_fee * 2;
            
            // Initialize game
            let game = Game {
                game_id,
                player1,
                player2,
                player1_wins: 0,
                player2_wins: 0,
                current_round: 1,
                state: WAITING_FOR_COMMITS,
                last_activity: get_block_timestamp(),
                prize_pool: total_prize_pool,
                winner: starknet::contract_address_const::<0>(),
            };
            
            // Initialize first round
            let current_time = get_block_timestamp();
            let round = Round {
                game_id,
                round_number: 1,
                player1_hash: 0,
                player2_hash: 0,
                player1_move: 0,
                player2_move: 0,
                player1_revealed: false,
                player2_revealed: false,
                commit_deadline: current_time + MOVE_TIMEOUT,
                reveal_deadline: current_time + (MOVE_TIMEOUT * 2),
            };
            
            // Update player states
            let mut player1_state = self.players.read(player1);
            player1_state.current_game = game_id;
            let mut player2_state = self.players.read(player2);
            player2_state.current_game = game_id;
            
            // Save everything
            self.games.write(game_id, game);
            self.rounds.write((game_id, 1), round);
            self.players.write(player1, player1_state);
            self.players.write(player2, player2_state);
            
            self.emit(Event::GameStarted(
                GameStarted { game_id, player1, player2, entry_fee }
            ));
        }
        
        fn _resolve_round(ref self: ContractState, game_id: u256, round: u8) {
            let mut game = self.games.read(game_id);
            let round_data = self.rounds.read((game_id, round));
            
            let winner = self._determine_round_winner(
                round_data.player1_move, 
                round_data.player2_move, 
                game.player1, 
                game.player2
            );
            
            // Update wins
            if winner == game.player1 {
                game.player1_wins += 1;
            } else if winner == game.player2 {
                game.player2_wins += 1;
            }
            
            self.emit(Event::RoundWon(
                RoundWon { 
                    game_id, 
                    round, 
                    winner, 
                    player1_move: round_data.player1_move, 
                    player2_move: round_data.player2_move 
                }
            ));
            
            // Check if game is complete
            if game.player1_wins == ROUNDS_TO_WIN {
                self._complete_game(game_id, game.player1);
            } else if game.player2_wins == ROUNDS_TO_WIN {
                self._complete_game(game_id, game.player2);
            } else if round < MAX_ROUNDS {
                // Start next round
                let next_round = round + 1;
                game.current_round = next_round;
                game.state = WAITING_FOR_COMMITS;
                game.last_activity = get_block_timestamp();
                self.games.write(game_id, game);
                
                let current_time = get_block_timestamp();
                let next_round_data = Round {
                    game_id,
                    round_number: next_round,
                    player1_hash: 0,
                    player2_hash: 0,
                    player1_move: 0,
                    player2_move: 0,
                    player1_revealed: false,
                    player2_revealed: false,
                    commit_deadline: current_time + MOVE_TIMEOUT,
                    reveal_deadline: current_time + (MOVE_TIMEOUT * 2),
                };
                self.rounds.write((game_id, next_round), next_round_data);
            } else {
                // Max rounds reached, determine winner by most wins
                if game.player1_wins > game.player2_wins {
                    self._complete_game(game_id, game.player1);
                } else {
                    self._complete_game(game_id, game.player2);
                }
            }
        }
        
        fn _complete_game(ref self: ContractState, game_id: u256, winner: ContractAddress) {
            let mut game = self.games.read(game_id);
            
            game.winner = winner;
            game.state = GAME_COMPLETE;
            self.games.write(game_id, game);
            
            // Clear player game associations
            let mut player1 = self.players.read(game.player1);
            let mut player2 = self.players.read(game.player2);
            player1.current_game = 0;
            player2.current_game = 0;
            self.players.write(game.player1, player1);
            self.players.write(game.player2, player2);
            
            self.emit(Event::GameWon(
                GameWon { game_id, winner, prize_amount: game.prize_pool }
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
            let global_state = self.global_state.read();
            let oracle_dispatcher = IPragmaOracleDispatcher {
                contract_address: global_state.pragma_oracle_address
            };
            
            let price_response: PragmaPricesResponse = oracle_dispatcher
                .get_data_median(DataType::SpotEntry(STRK_USD_ASSET_ID));
            
            price_response.price
        }
    }
} 