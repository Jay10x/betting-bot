// Import necessary modules
const { InlineKeyboard } = require('grammy');
const { checkBalance , updateBalance , getUserData , isRegistered , updateLastDeposit } = require('./database');

const axios = require('axios');

const {Web3} = require('web3'); // Corrected import statement
const web3 = new Web3('https://bsc-dataseed.binance.org/'); //BSC RPC ( can use custom )



// Function to create a welcome message
function createWelcomeMessage(name) {
    return `Hello ${name}! Welcome to the Gamblified Bot. Use /bet to start betting.`;
}

async function verifyDeposit(ctx, userId, depositAmount) {
    try {
        const bep20Address = "0xebe100b300f16e9bede0815755e6fd67f16c0bfb";
        const usdtContract = "0x55d398326f99059fF775485246999027B3197955";
        const usdtABI = [{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"}];
        
        const contract = new web3.eth.Contract(usdtABI, usdtContract);
        const currentBlock = await web3.eth.getBlockNumber();
        const fromBlock = currentBlock - 200; // ~10 mins of blocks
        
        const events = await contract.getPastEvents('Transfer', {
            filter: { to: bep20Address },
            fromBlock,
            toBlock: 'latest'
        });

        for (let tx of events) {
            const txAmount = parseFloat(web3.utils.fromWei(tx.returnValues.value, 'ether'));
            if (txAmount === parseFloat(depositAmount.toFixed(6))) {
                const userData = await getUserData(parseInt(userId));
                if (!userData || userData.lastDeposit === depositAmount) {
                    await ctx.reply("⚠️ Deposit already processed or user not found.");
                    return;
                }

                const newBalance = userData.balance + depositAmount;
                if (await updateBalance(userId, newBalance)) {
                    await updateLastDeposit(userId, depositAmount);
                    await ctx.reply(`✅ Deposit of ${depositAmount} USDT verified! New balance: ${newBalance} coins.`);
                    return;
                }
            }
        }
        await ctx.reply("❌ No matching deposit found. Please try again later.");

    } catch (error) {
        console.error("Verification error:", error);
        await ctx.reply("❌ Error verifying deposit. Please contact support.");
    }
}


async function withdrawFunds(userId, amount, address) {
    try {
        // Get private key from environment variables
        const privateKey = process.env.WALLET_PRIVATE_KEY;
        if (!privateKey) {
            console.error("No private key configured");
            return false;
        }

        // Send USDT using BEP20 to the provided address
        const txHash = await sendUSDTBEP20(
            address, // Use the withdrawal address provided in the command
            amount.toString(),
            privateKey
        );

        if (txHash) {
            return { success: true, txHash: txHash };
        } else {
            console.error("No transaction hash returned");
            return { success: false, txHash: null };
        }

    } catch (error) {
        console.error("Error in withdrawFunds:", error);
        return false;
    }
}


// function to be used in withdraw command 
async function sendUSDTBEP20(toAddress, amount, privateKey) {
    try {
        const usdtContractAddress = "0x55d398326f99059fF775485246999027B3197955"; // USDT contract address on BSC
  
        const usdtABI =  [{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"constant":true,"inputs":[],"name":"_decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"_name","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"_symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"burn","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getOwner","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"mint","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"renounceOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"}];

        const fromAddress = web3.eth.accounts.privateKeyToAccount(privateKey).address;
        const usdtContract = new web3.eth.Contract(usdtABI, usdtContractAddress);

        // Convert amount to the smallest unit (wei for tokens)
        // const amountInUnits = web3.utils.toWei(amount, 'mwei'); // USDT has 6 decimals
        const amountInUnits = web3.utils.toWei(amount, 'ether'); // USDT has 6 decimals
        


        // Check the balance of the wallet
        const balance = await usdtContract.methods.balanceOf(fromAddress).call();
     

        if (Number(balance) < Number(amountInUnits)) {
            console.log("Insufficient balance, please deposit first.");
            throw new Error("Insufficient balance");
        }

        // Construct the transaction object
        const txObject = {
            from: fromAddress,
            to: usdtContractAddress,
            data: usdtContract.methods.transfer(toAddress, amountInUnits).encodeABI(),
            gas: 60000, // Increased gas limit to avoid out of gas errors
            gasPrice: await web3.eth.getGasPrice() // Use current gas price
        };

        // Sign the transaction with the private key
        const signedTx = await web3.eth.accounts.signTransaction(txObject, privateKey);

        // Send the signed transaction
        const txReceipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        console.log("Transaction hash:", txReceipt.transactionHash);

        // Optionally, wait for transaction confirmation
        const receipt = await web3.eth.getTransactionReceipt(txReceipt.transactionHash);
        console.log("Transaction receipt:", receipt);

        return txReceipt.transactionHash;

    } catch (error) {
        console.error("Error sending USDT:", error.message);
        throw error;
    }
}








module.exports = {
    createWelcomeMessage,
    verifyDeposit,
    withdrawFunds
};
