const express = require("express");
const mongoose = require("mongoose");
const app = express();
const port = process.env.PORT || 5000;  // Use environment variable for port

// MongoDB connection
mongoose.connect("mongodb+srv://ameeqahmad05:ameeq25012003@blogapp.f1jim.mongodb.net/?retryWrites=true&w=majority&appName=blogapp", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    sslValidate: false,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log("Successfully connected to MongoDB");
});

app.use(express.json());
const userRoute = require("./routes/user");
app.use("/user", userRoute);

// Define routes
app.route("/").get((req, res) => res.json("your first rest api 2"));

// Start the server
app.listen(port, () => console.log(`Your server is running on port ${port}`));
