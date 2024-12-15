# Betting Bot

Betting Bot is a Telegram bot that allows users to bet on coin tosses, check their balance, deposit funds, and more. The bot uses the Grammy framework and MongoDB for data storage.

## Features

- **Betting**: Users can place bets on coin tosses and win or lose coins.
- **Balance Check**: Users can check their current balance.
- **Deposit**: Users can deposit funds into their account.
- **Withdrawal**: Users can withdraw funds from their account (feature coming soon).
- **Betting History**: Users can view their betting history (feature coming soon).

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/Jay10x/betting-bot.git
    cd betting-bot
    ```

2. Install the dependencies:
    ```sh
    npm install
    ```

3. Set up MongoDB:
    - Put your mongodb URI in database.js .
    - The database name is `gmbl` and the collection name is `users`.

4. Update the bot token and wallet private key:
    - Replace keys in .env file

5. Start the bot:
    ```sh
    node index.js
    ```

## Usage

### Commands

- `/start`: Start the bot and register the user.
- `/help`: Display the help message with available commands.
- `/bet`: Start the betting process.
- `/balance`: Check the current balance.
- `/deposit <amount>`: Deposit the specified amount into the user's account.
- `/withdraw`: Withdraw funds from the user's account (feature coming soon).
- `/history`: View the betting history (feature coming soon).
- `/add <amount>`: Add a specific amount to the user's account.

### Betting

1. Use `/bet` to start the betting process.
2. Choose your bet amount or enter a custom amount.
3. The bot will flip a coin for you.
4. If you win, you double your bet amount (minus a 5% commission).

### Deposit

1. Use `/deposit <amount>` to deposit funds into your account.
2. Follow the instructions provided by the bot to complete the deposit.

## Files

- [index.js]: Main bot logic and command handlers.
- [betFunc.js]: Functions related to betting.
- [database.js]: Functions for interacting with the MongoDB database.
- [function.js]: Utility functions and API interactions.
- [withdraw.js]: Functions for handling withdrawals (feature coming soon).
- [package.json]: Project dependencies.

## Dependencies

- `@grammyjs/conversations`: Conversations plugin for Grammy.
- `@grammyjs/parse-mode`: Parse mode plugin for Grammy.
- `axios` : Promise-based HTTP client.
- `grammy`: Telegram Bot API framework.
- `mongodb`: MongoDB driver for Node.js.
- `web3`: Ethereum JavaScript API to send crypto (withdraw).

## License

This project is licensed under the MIT License.
