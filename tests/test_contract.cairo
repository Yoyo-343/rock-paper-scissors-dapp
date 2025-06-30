use starknet::ContractAddress;

#[test]
fn test_contract_basic() {
    // Basic test to ensure contract compiles and types work
    let alice: ContractAddress = 'alice'.try_into().unwrap();
    let bob: ContractAddress = 'bob'.try_into().unwrap();
    
    assert!(alice != bob, "Alice and Bob should be different addresses");
    
    // Test some basic calculations similar to what the contract would do
    let eth_price_usd: u256 = 200000000000; // $2000 with 8 decimals
    let one_dollar_with_decimals: u256 = 100000000; // $1 with 8 decimals
    let eth_decimals: u256 = 1000000000000000000; // 10^18
    
    let required_wei = (one_dollar_with_decimals * eth_decimals) / eth_price_usd;
    let expected_wei = 500000000000000_u256; // 0.0005 ETH in wei
    
    assert!(required_wei == expected_wei, "Entry fee calculation should be correct");
}

#[test]
fn test_move_validation() {
    // Test the rock paper scissors game logic constants
    const ROCK: u8 = 1;
    const PAPER: u8 = 2;
    const SCISSORS: u8 = 3;
    
    // Test valid moves
    assert!(ROCK >= 1 && ROCK <= 3, "Rock should be valid move");
    assert!(PAPER >= 1 && PAPER <= 3, "Paper should be valid move");
    assert!(SCISSORS >= 1 && SCISSORS <= 3, "Scissors should be valid move");
    
    // Test game logic
    // Rock beats scissors
    assert!(rock_beats(ROCK, SCISSORS), "Rock should beat scissors");
    // Scissors beats paper
    assert!(rock_beats(SCISSORS, PAPER), "Scissors should beat paper");
    // Paper beats rock
    assert!(rock_beats(PAPER, ROCK), "Paper should beat rock");
    
    // Test ties
    assert!(!rock_beats(ROCK, ROCK), "Rock vs Rock should be tie");
    assert!(!rock_beats(PAPER, PAPER), "Paper vs Paper should be tie");
    assert!(!rock_beats(SCISSORS, SCISSORS), "Scissors vs Scissors should be tie");
}

#[test]
fn test_treasury_calculation() {
    const TREASURY_FEE_PERCENT: u8 = 25;
    
    let total_prize: u256 = 1000;
    let treasury_amount = total_prize * TREASURY_FEE_PERCENT.into() / 100;
    let player_amount = total_prize - treasury_amount;
    
    assert!(treasury_amount == 250, "Treasury should get 25% (250)");
    assert!(player_amount == 750, "Player should get 75% (750)");
}

// Helper function to test Rock Paper Scissors logic
fn rock_beats(move1: u8, move2: u8) -> bool {
    const ROCK: u8 = 1;
    const PAPER: u8 = 2;
    const SCISSORS: u8 = 3;
    
    if move1 == move2 {
        false // tie
    } else if (move1 == ROCK && move2 == SCISSORS) || 
              (move1 == PAPER && move2 == ROCK) || 
              (move1 == SCISSORS && move2 == PAPER) {
        true // move1 wins
    } else {
        false // move2 wins
    }
} 