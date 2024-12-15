//grammy lib
const {Bot,Keyboard, session, HttpError ,InlineKeyboard, InlineQueryResultBuilder } = require('grammy');
const { conversations } = require('@grammyjs/conversations')
const { hydrateReply, parseMode } = require("@grammyjs/parse-mode");
const { processBet } = require('./betFunc');
const { CheckAndRegister , checkBalance, updateBalance , updateLastBetAmount} = require('./database');



const { createConversation } = require('@grammyjs/conversations');

const { createWelcomeMessage, verifyDeposit } = require('./function');

const bot = new Bot('YOUR_TG_BOT_TOKEN'); 

bot.use(hydrateReply);



bot.command('start', ctx => {
    
  var user_dtl = ctx.update.message.from;
  var name = user_dtl.first_name;
  
  
  ctx.replyWithHTML(createWelcomeMessage(name));


  // Check if the message is from a private chat
  if (ctx.chat.type === 'private') {
    // Register the user
  CheckAndRegister(user_dtl);
    
   
  }


  
});












 
bot.command('help', ctx => {
    const helpMessage = `
Welcome to Gamblified Bot! Here are the available commands:

1. /bet - Start betting
2. /balance - Check your current balance
3. /deposit - Add funds to your account
4. /withdraw - Withdraw funds from your account
5. /history - View your betting history

How to bet:
1. Use /bet to start betting.
2. Choose your bet amount or enter a custom amount.
3. We'll flip a coin for you.
4. If you win, you double your bet!

Please note: We charge a 5% commission on winning bets.

Good luck and gamble responsibly!
    `;
    
    ctx.reply(helpMessage);
});


bot.command('balance', async (ctx) => {
    const userId = ctx.from.id;
    const balance = await checkBalance(userId);
    
    if (balance !== null) {
        const roundedBalance = Number(balance.toFixed(6));
        await ctx.reply(`Your current balance is ${roundedBalance} coins.`);
    } else {
        await ctx.reply("Error: Unable to retrieve your balance. Please try again later.");
    }
});

bot.command('history', async (ctx) => {
    await ctx.reply("Betting history feature coming soon!");
});

bot.command('withdraw', async (ctx) => {
    await ctx.reply("Withdrawal feature coming soon!");
});






















// bet command 
bot.command('bet', async (ctx) => {
    const exampleBets = [10, 50, 100, 500];
    const keyboard = {
        keyboard: [exampleBets.map(bet => ({ text: `Bet ${bet}` }))],
        resize_keyboard: true,
        one_time_keyboard: true
    };

    await ctx.reply("Choose your bet amount or enter a custom amount in this format: bet <amount>", {
        reply_markup: keyboard
    });
});




// deposit command
bot.command('deposit', async (ctx) => {
    const message = ctx.message.text;
    const parts = message.split(' ');
    
    if (parts.length !== 2) {
        await ctx.reply("Please use the correct format: /deposit <amount>");
        return;
    }

    const amount = parseFloat(parts[1]);
    
    if (isNaN(amount) || amount <= 0) {
        await ctx.reply("Please enter a valid deposit amount. For example: /deposit 100");
        return;
    }

    const userId = ctx.from.id;
    const currentBalance = await checkBalance(userId);

    if (currentBalance === null) {
        await ctx.reply("Error: Unable to retrieve your balance. Please try again later.");
        return;
    }

    const newBalance = (currentBalance + amount).toFixed(6);
    const updateResult = await updateBalance(userId, parseFloat(newBalance));

    if (updateResult) {
        await ctx.reply(`Deposit successful! Your new balance is ${newBalance} coins.`);
    } else {
        await ctx.reply("Error: Unable to process your deposit. Please try again later.");
    }
});


bot.command('balance', async (ctx) => {
    const userId = ctx.from.id;
    const balance = await checkBalance(userId);

    if (balance !== null) {
        await ctx.reply(`Your current balance is ${balance} coins.`);
    } else {
        await ctx.reply("Error: Unable to retrieve your balance. Please try again later.");
    }
});












bot.command('add', async (ctx) => {
    const input = ctx.message.text.split(' ');
    if (input.length !== 2) {
        await ctx.reply("Please use the correct format: /add <amount>");
        return;
    }

    const amount = parseFloat(input[1]);
    if (isNaN(amount) || amount <= 0) {
        await ctx.reply("Please enter a valid deposit amount. For example: /add 100");
        return;
    }

    const userId = ctx.from.id;
    const userIdLastThreeDigits = userId.toString().slice(-3);
    const randomThreeDigits = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const depositAmount = (amount + parseFloat(`0.${randomThreeDigits}${userIdLastThreeDigits}`)).toFixed(6); // Add 6 digits after decimal
    // const depositAmount = 39.900000; // for testing purposes

    const bep20Address = "0x1234567890123456789012345678901234567890"; // Replace with your actual BEP20 USDT address

    const message = `Please deposit exactly ${depositAmount} USDT (BEP20) to the following address:\n\n` +
                    `${bep20Address}\n\n` +
                    `Important: This deposit is linked to your user ID (${userId}). \n\n` +
                    `⚠️ Must send exact amount⚠️ else you may lose your money.\n\n` +
                    `Do not send any other amount to avoid complications in verification.\n\n` +
                    `After sending, please click on 'Verify Now' within 5 minutes.\n\n` +
                    `If your deposit is not added in the first try, please try again.\n\n` +
                    `This process may take a few minutes. Thank you for your patience.`;

    const inlineKeyboard = new InlineKeyboard()
        .text("Verify Now", `verify_deposit:${userId}:${depositAmount}`);

    await ctx.reply(message, { reply_markup: inlineKeyboard });

});



// Handle deposit verification callback query
bot.callbackQuery(/^verify_deposit:/, async (ctx) => {
    const [, userId, depositAmount] = ctx.callbackQuery.data.split(':');
    await ctx.answerCallbackQuery();

    // Call the verification function
    await verifyDeposit(ctx, userId, parseFloat(depositAmount));

    
});






// on response of bet command
bot.on('message', async (ctx) => {
    const message = ctx.message.text;
    if (message.toLowerCase().startsWith('bet ') || message.startsWith('Bet ')) {
        const betAmount = parseFloat(message.split(' ')[1]);
        if (isNaN(betAmount) || betAmount < 0.05) {
            await ctx.reply("Please enter a valid bet amount (minimum 0.05). For example: bet 0.05");
        } else {
            const userId = ctx.from.id;
            const currentBalance = await checkBalance(userId);

            if (currentBalance === null) {
                await ctx.reply("Error: Unable to retrieve your balance. Please try again later.");
                return;
            }

            if (currentBalance < betAmount) {
                await ctx.reply(`Sorry, you don't have enough balance for this bet. Your current balance is ${currentBalance} coins.`);
                return;
            }

            // Save the bet amount in the database
            await updateLastBetAmount(userId, betAmount);

            await ctx.reply(`You've placed a bet of ${betAmount}. Good luck!`);
            console.log("betAmount while sending inline keyboard", betAmount);

            // Here you would add the logic to process the bet
            const inlineKeyboard = new InlineKeyboard()
                .text("Heads", `coin_toss:heads:${betAmount}`)
                .text("Tails", `coin_toss:tails:${betAmount}`);
            
            await ctx.reply("Choose Heads or Tails:", { reply_markup: inlineKeyboard });
        }
    } 
});


// Handle coin toss callback query
bot.callbackQuery(/^coin_toss:/, async (ctx) => {
    const [, choice, betAmount] = ctx.callbackQuery.data.split(':');
    await ctx.answerCallbackQuery();
    // console.log(choice, betAmount);
    
    await processBet(ctx, parseFloat(betAmount), choice);
});




bot.start();
