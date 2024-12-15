// Import the checkBalance function from the database module
const { checkBalance , updateBalance } = require('./database');



async function processBet(ctx, betAmount, choice) {
    console.log("betAmount", betAmount);
    const userId = ctx.from.id;
    const currentBalance = await checkBalance(userId);
    
    if (currentBalance === null) {
        await ctx.reply("Error: Unable to retrieve your balance. Please try again later.");
        return;
    }
    
    console.log(`User ${userId} balance: ${currentBalance} coins`);

    // Check if user has enough balance for the bet
    if (currentBalance < betAmount) {
        await ctx.reply(`Sorry, you don't have enough balance for this bet. Your current balance is ${currentBalance} coins.`);
        return;
    }
    
    // Coin toss result and win/loss determination
    let result;
    if (Math.random() < 0.5) {
        result = 'heads';
    } else {
        result = 'tails';
    }
    
    const won = choice === result;
    
    // Calculate winnings, commission, and update balance
    let newBalance;
    if (won) {
        const winnings = betAmount * 2;
        // Use toFixed(6) to avoid floating point precision issues
        const commission = parseFloat((winnings * 0.05).toFixed(6));
        newBalance = currentBalance + winnings - commission - betAmount;
    } else {
        newBalance = currentBalance - betAmount;
    }
    
    // Update the user's balance in the database
    const updateResult = await updateBalance(userId, newBalance);
    
    if (!updateResult) {
        await ctx.reply("Error: Unable to update your balance. Please contact support.");
        return;
    }
    // Construct the message
    let message = `The coin landed on ${result}.\n\n`;
    if (won) {
        const winnings = betAmount * 2;
        // Use toFixed(6) to avoid floating point precision issues
        const commission = parseFloat((winnings * 0.05).toFixed(6));
        const netProfit = parseFloat((winnings - commission - betAmount).toFixed(6));
        message += `🟢 Congratulations! You've won! 🎉\n`;
        message += `Bet amount: ${betAmount.toFixed(6)} coins\n`;
        message += `Winnings: ${winnings.toFixed(6)} coins\n`;
        message += `Commission (5%): ${commission.toFixed(6)} coins\n`;
        message += `Net profit: ${netProfit.toFixed(6)} coins\n`;
    } else {
        message += `🔴 Oh no! Better luck next time. 😔\n`;
        message += `Bet amount: ${betAmount.toFixed(6)} coins\n`;
        message += `Loss: ${betAmount.toFixed(6)} coins\n`;
    }
    message += `Updated balance: ${newBalance.toFixed(6)} coins`;
    // Send the reply
    await ctx.reply(message);

    // Send next bet options
    await sendNextBetOptions(ctx, betAmount);
}

const { InlineKeyboard } = require('grammy');

async function sendNextBetOptions(ctx, previousBetAmount) {
    const { getUserData } = require('./database');
    const userId = ctx.from.id;
    const userData = await getUserData(userId);
    const lastBetAmount = userData.lastBetAmount || previousBetAmount;

    const doubleAmount = (previousBetAmount * 2).toFixed(6).replace(/\.?0+$/, '');
    const formattedPreviousAmount = previousBetAmount.toFixed(6).replace(/\.?0+$/, '');
    const formattedLastBetAmount = lastBetAmount.toFixed(6).replace(/\.?0+$/, '');

    const inlineKeyboard = new InlineKeyboard()
        .text(`Heads ${formattedPreviousAmount}`, `coin_toss:heads:${previousBetAmount}`)
        .text(`Tails ${formattedPreviousAmount}`, `coin_toss:tails:${previousBetAmount}`)
        .row()
        .text(`Heads ${doubleAmount}`, `coin_toss:heads:${doubleAmount}`)
        .text(`Tails ${doubleAmount}`, `coin_toss:tails:${doubleAmount}`)
        .row()
        .text(`Heads ${formattedLastBetAmount}`, `coin_toss:heads:${lastBetAmount}`)
        .text(`Tails ${formattedLastBetAmount}`, `coin_toss:tails:${lastBetAmount}`);

    await ctx.reply("Want to bet again? Choose your option:", { reply_markup: inlineKeyboard });
}




module.exports = {
    processBet
};
