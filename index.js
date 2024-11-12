const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Load user data from users.json, handling potential errors
let users = [];
try {
  const data = fs.readFileSync('public/users.json', 'utf8');
  users = JSON.parse(data).users || [];
} catch (error) {
  console.error('Error loading user data:', error);
  users = [];
}


// Function to save users to users.json, including error handling
function saveUsers() {
  try {
    fs.writeFileSync('public/users.json', JSON.stringify({ users }, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving user data:', error);
  }
}

// API endpoint for registering new users
app.put('/users', (req, res) => {
  const newUsers = req.body.users;
   if(!Array.isArray(newUsers)){
     return res.status(400).json({ error: "Invalid data format" }); // Crucial for user-side input!
   }

   users = newUsers;
  saveUsers();

  res.status(200).json({ message: 'Users updated successfully' });
});


// API endpoint for handling login attempts
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }


     const userId = uuidv4();
     res.json({ success: true, userId: userId, user }); //Return the success boolean!

});
app.post('/transactions', (req, res) => {
  try {
    const { senderId, recipientId, amount } = req.body;
  // ... (your input validation from before)

//Critically important - validation

  const sender = users.find(user => user.id === senderId);
  const recipient = users.find(user => user.id === recipientId);


  if (!sender || !recipient) {
    return res.status(404).json({ success: false, error: "Sender or recipient not found" });
  }


 if (sender.balance < amount){
 return res.status(400).json({ success: false, error: "Insufficient Funds" })

}
   sender.balance -= amount;
    recipient.balance += amount;


 const newTransaction = {
      date: new Date().toISOString().slice(0, 10), 
    senderId,
    recipientId,
      amount
  };
    //Very crucial, update and save transactions history. Handle if doesn't exist!

    sender.transactions = sender.transactions || []; //Initialize with empty array

 sender.transactions.push(newTransaction)


     recipient.transactions = recipient.transactions || []; 
   recipient.transactions.push({...newTransaction, amount: amount}) // Correct for new transactions



    saveUsers();
  return res.status(200).json({ success: true, message: "Transaction complete" });



  } catch (err) {
    console.error("Error saving transaction:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ... other routes, such as handling requests from 'index.html'

// Start the server
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));