const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();
const User = require('./models/User');


mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Connected to MongoDB");
}).catch((error) => {
    console.log("Error connecting to MongoDB:", error);
});

async function createTestUser() {
    try {
        const hashedPassword = await bcrypt.hash("password123", 10);
        const user = new User({
            username: "testuser",
            email: "test@example.com",
            password: hashedPassword
        });
        await user.save();
        console.log("User created successfully");
        mongoose.connection.close();
    } catch (error) {
        console.log("Error creating user:", error);
    }
}

createTestUser();
