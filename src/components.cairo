use starknet::ContractAddress;

// Game Component - stores game state
#[derive(Copy, Drop, Serde, starknet::Store)]
pub struct Game {
    pub game_id: u256,
    pub player1: ContractAddress,
    pub player2: ContractAddress,
    pub player1_wins: u8,
    pub player2_wins: u8,
    pub current_round: u8,
    pub state: u8, // 1=commits, 2=reveals, 3=complete, 4=forfeited
    pub last_activity: u64,
    pub prize_pool: u256,
    pub winner: ContractAddress,
}

// Round Component - stores round-specific data
#[derive(Copy, Drop, Serde, starknet::Store)]
pub struct Round {
    pub game_id: u256,
    pub round_number: u8,
    pub player1_hash: felt252,
    pub player2_hash: felt252,
    pub player1_move: u8,
    pub player2_move: u8,
    pub player1_revealed: bool,
    pub player2_revealed: bool,
    pub commit_deadline: u64,
    pub reveal_deadline: u64,
}

// Player Component - stores player state
#[derive(Copy, Drop, Serde, starknet::Store)]
pub struct Player {
    pub player: ContractAddress,
    pub current_game: u256,
    pub games_played: u256,
    pub games_won: u256,
    pub total_winnings: u256,
}

// Queue Component - stores matchmaking queue
#[derive(Copy, Drop, Serde, starknet::Store)]
pub struct Queue {
    pub id: u8, // Always 1 for singleton
    pub player1: ContractAddress,
    pub player2: ContractAddress,
    pub length: u32,
}

// Global State Component - stores global game state
#[derive(Copy, Drop, Serde, starknet::Store)]
pub struct GlobalState {
    pub id: u8, // Always 1 for singleton
    pub game_counter: u256,
    pub total_games_played: u256,
    pub treasury_balance: u256,
    pub pragma_oracle_address: ContractAddress,
    pub strk_token_address: ContractAddress,
    pub owner: ContractAddress,
    pub emergency_paused: bool,
}

// Move constants
pub const ROCK: u8 = 1;
pub const PAPER: u8 = 2;
pub const SCISSORS: u8 = 3;

// Game state constants
pub const WAITING_FOR_COMMITS: u8 = 1;
pub const WAITING_FOR_REVEALS: u8 = 2;
pub const GAME_COMPLETE: u8 = 3;
pub const FORFEITED: u8 = 4;

// Game configuration constants
pub const ROUNDS_TO_WIN: u8 = 3;
pub const MAX_ROUNDS: u8 = 5;
pub const MOVE_TIMEOUT: u64 = 60; // 1 minute in seconds
pub const TREASURY_FEE_PERCENT: u8 = 25;

// Oracle constants
pub const STRK_USD_ASSET_ID: felt252 = 6004514686061859652; // Pragma's STRK/USD pair ID

// STRK Token Contract Address (Sepolia Testnet)
pub const STRK_TOKEN_ADDRESS: felt252 = 0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d; 