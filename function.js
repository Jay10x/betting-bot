// Import necessary modules
const { InlineKeyboard } = require('grammy');
const { checkBalance , updateBalance , getUserData , isRegistered , updateLastDeposit } = require('./database');

const axios = require('axios');


// Function to create a welcome message
function createWelcomeMessage(name) {
    return `Hello ${name}! Welcome to the Gamblified Bot. Use /bet to start betting.`;
}






async function checkBEP20Transactions(address, contractAddress, apiKey) {
    try {
        const response = await axios.get('https://api.bscscan.com/api', {
            params: {
                module: 'account',
                action: 'tokentx',
                contractaddress: contractAddress,
                address: address,
                startblock: 0,
                endblock: 99999999,
                sort: 'desc',
                apikey: apiKey
            }
        });

        if (response.data.status === "1" && response.data.message === "OK") {
            return response.data.result;
        } else {
            console.error("BscScan API error:", response.data.message);
            return null;
        }
    } catch (error) {
        console.error("Error fetching BEP20 transactions:", error.message);
        return null;
    }
}

async function verifyDeposit(ctx, userId, depositAmount) {
    var userId = parseInt(userId);
    
    const bep20Address = "0xebe100b300f16e9bede0815755e6fd67f16c0bfb"; // Your BEP20 wallet address
    const usdtContractAddress = "0x55d398326f99059fF775485246999027B3197955"; // USDT contract address on BSC
    const apiKey = "C4UQJFBSEVEI3JKWAQD67D7IWXZTQDQ1AA"; // Replace with your actual BscScan API key
    const timeframe = 10 * 60 * 1000; // 10 minutes in milliseconds
  

    try {
        const transactions = await checkBEP20Transactions(bep20Address, usdtContractAddress, apiKey);
        
        if (!transactions) {
            await ctx.reply("❌ There was an error verifying your deposit. Please try again later or contact support.");
            return;
        }

        const matchingTransaction = transactions.find(tx => {
            const txAmount = parseFloat((parseFloat(tx.value) / 1e18).toFixed(6)); // Convert from wei to USDT and round to 6 decimal places
            const txTimestamp = parseInt(tx.timeStamp) * 1000; // Convert to milliseconds
            return txAmount === parseFloat(depositAmount.toFixed(6)) && // Compare with 6 decimal precision
                   (Date.now() - txTimestamp) <= timeframe;
        });

        if (matchingTransaction) {
            // Deposit verified successfully
            const userData = await getUserData(userId);
            console.log(userData);
            if (userData !== null) {
                // Check if this deposit has already been processed
                if (userData.lastDeposit === depositAmount) {
                    await ctx.reply("⚠️ This deposit has already been processed. Your balance remains unchanged.");
                    return;
                }

                const newBalance = userData.balance + depositAmount;
                const updateResult = await updateBalance(userId, newBalance);
                
                if (updateResult) {
                    // Update lastDeposit field
                    await updateLastDeposit(userId, depositAmount);
                    
                    await ctx.reply(`✅ Deposit of ${depositAmount} USDT verified successfully! Your new balance is ${newBalance} coins.`);

                    // Remove the inline keyboard after successful verification
                    if (ctx.callbackQuery.message) {
                        await ctx.api.editMessageReplyMarkup(
                            ctx.callbackQuery.message.chat.id,
                            ctx.callbackQuery.message.message_id,
                            { reply_markup: { inline_keyboard: [] } }
                        );
                    }
                } else {
                    await ctx.reply("❌ Deposit verified, but there was an error updating your balance. Please contact support.");
                }
            } else {
                await ctx.reply("❌ Deposit verified, but there was an error retrieving your current balance. Please contact support.");
            }
        } else {
            // No matching deposit found
            await ctx.reply(`❌ No matching deposit of ${depositAmount} USDT found in the last 10 minutes. Please try again or contact support if you believe this is an error.`);
        }
    } catch (error) {
        console.error("Error verifying deposit:", error);
        await ctx.reply("❌ There was an error verifying your deposit. Please try again later or contact support.");
    }
}













module.exports = {
    createWelcomeMessage,
    verifyDeposit
};
