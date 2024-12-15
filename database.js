const MongoClient = require('mongodb').MongoClient;


var uri = "mongodb://localhost:27017"  // local MongoDB URI

var dbName = "gmbl"; //database name
var collectionName = "users"  // collection name




async function ConnectDB (DB_NAME){


    try {
        const client = await MongoClient.connect(uri);
        const db =  client.db(DB_NAME);

        return [db , client];
        
      } catch (err) {
        console.error('Error reading data:', err);
      }



}

async function ReadCl(coll_name){
  const [db , client ] = await ConnectDB(dbName);

    const collection =  db.collection(coll_name);
    const cursor = await collection.find({}).toArray();
    console.log(cursor);
    await client.close();

}


async function CheckData(coll_name,data){
    const [db , client ] = await ConnectDB(dbName);
    const collection =  db.collection(coll_name);
    const documents = await collection.find(data).toArray();

    // console.log(data); 

    if(documents.length ==  1 ){
        var res = true;
    }
    else if(documents.length > 1){
        // duplicate data exists
        console.log("There is duplicate doc.");
        // await logError("NOTICE: Data is duplicate for user id: "+ documents[0]['user_id']);
        var res = true;
    }
    else{
        var res = false;
    }

    await client.close();


    return [res , documents[0]];


}


async function WriteDoc (coll_name , data){

const [db , client ] = await ConnectDB(dbName);
const collection =  db.collection(coll_name);
const write = await collection.insertOne(data)

console.log(`Document inserted with ID: ${write.insertedId}`);



// close db
await client.close();
return write.acknowledged;

}


// Update CheckAndRegister function to use isRegistered
async function CheckAndRegister(user) {
    const registered = await isRegistered(user.id);

    if (!registered) {
        const newUser = {
            user_id: user.id,
            name: user.first_name,
            username: user.username || '',
            joining_date: new Date(),
            balance: 0,
            lastDeposit: 0  // Added lastDeposit field with default value of 0
        };

        const writeResult = await WriteDoc('users', newUser);
        if (writeResult) {
            console.log(`New user registered: ${user.first_name} (ID: ${user.id})`);
            return [false, newUser];
        } else {
            console.error(`Failed to register new user: ${user.first_name} (ID: ${user.id})`);
            return [false, null];
        }
    } else {
        console.log("User already registered");
    }

    const userData = await getUserData(user.id);
    return [true, userData];
}



async function isRegistered(userId) {
    const [db, client] = await ConnectDB(dbName);
    const collection = db.collection('users');
    
    try {
        const user = await collection.findOne({ user_id: userId });
        return user !== null;
    } catch (error) {
        console.error(`Error checking user registration: ${error}`);
        return false;
    } finally {
        await client.close();
    }
}



async function getUserData(userId) {
    const [db, client] = await ConnectDB(dbName);
    const collection = db.collection('users');
    
    try {
        return await collection.findOne({ user_id: userId });
    } catch (error) {
        console.error(`Error fetching user data: ${error}`);
        return null;
    } finally {
        await client.close();
    }
}



async function checkBalance(userId) {
    const [db, client] = await ConnectDB(dbName);
    const collection = db.collection('users');
    
    try {
        const user = await collection.findOne({ user_id: userId });
        if (user) {
            return user.balance;
        } else {
            console.log(`User not found: ${userId}`);
            return null;
        }
    } catch (error) {
        console.error(`Error checking balance: ${error}`);
        return null;
    } finally {
        await client.close();
    }
}

async function updateBalance(userId, newBalance) {
    var userId = parseInt(userId);
    const [db, client] = await ConnectDB(dbName);
    const collection = db.collection('users');
    
    try {
        // Ensure newBalance is a number
        newBalance = parseFloat(newBalance);
        
        if (isNaN(newBalance)) {
            console.error(`Invalid balance value: ${newBalance}`);
            return false;
        }

        const result = await collection.updateOne(
            { user_id: userId },
            { $set: { balance: newBalance } }
        );
        
        if (result.matchedCount === 1) {
            console.log(`Balance updated for user: ${userId} to ${newBalance}`);
            return true;
        } else {
            console.log(`User not found: ${userId}`);
            return false;
        }
    } catch (error) {
        console.error(`Error updating balance: ${error}`);
        return false;
    } finally {
        await client.close();
    }
}

async function updateLastDeposit(userId, depositAmount) {
    const [db, client] = await ConnectDB(dbName);
    const collection = db.collection('users');
    
    try {
        const result = await collection.updateOne(
            { user_id: userId },
            { $set: { lastDeposit: depositAmount } }
        );
        
        if (result.modifiedCount === 1) {
            console.log(`Last deposit updated for user: ${userId}`);
            return true;
        } else {
            console.log(`User not found or last deposit not updated: ${userId}`);
            return false;
        }
    } catch (error) {
        console.error(`Error updating last deposit: ${error}`);
        return false;
    } finally {
        await client.close();
    }
}

async function updateLastBetAmount(userId, betAmount) {
    const [db, client] = await ConnectDB(dbName);
    const collection = db.collection('users');
    
    try {
        const result = await collection.updateOne(
            { user_id: userId },
            { $set: { lastBetAmount: betAmount } }
        );
        
        if (result.modifiedCount === 1) {
            console.log(`Last bet amount updated for user: ${userId}`);
            return true;
        } else {
            console.log(`User not found or last bet amount not updated: ${userId}`);
            return false;   
        }
    } catch (error) {
        console.error(`Error updating last bet amount: ${error}`);
        return false;
    } finally {
        await client.close();
    }
}


module.exports = {CheckAndRegister , checkBalance , updateBalance , getUserData,isRegistered  , updateLastDeposit , updateLastBetAmount};
