//server with conneting to mongoBD

//step 0 imports
const { timeStamp } = require("console");
const express = require("express");
const mongoose = require("mongoose");

const app = express();

app.use(express.static("public"));

//step 1  parsers
app.use(express.json());    //to parse json data
app.use(express.urlencoded({ extended : true}));    //to parse form data

const uri = "mongodb+srv://teegalapoojith2004:au0mUGrJIsiYkIcp@cluster3.smzcsei.mongodb.net/?retryWrites=true&w=majority&appName=Cluster3";

//step 2  mongoDB connection
(async () => {
    try {
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("✅ Connected to MongoDB Atlas---");
    } catch(err){
        console.log("❌ Connection failed---", err.message);
        process.exit(1);
    }
})();

//step 3 Define a schema and a model (mongoose)
const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true},
        email: { type: String, required: true, trim:true, lowercase: true, unique: true},
        age: { type: Number, min:0},
    },
    {timestamps: true}
);

const User = mongoose.model("User", userSchema);    //this function creates a model based on schema

// Helper: validate MongoDB ObjectId
const isValidId = (id) => mongoose.isValidObjectId(id);

// STEP 4: Health check route
app.get("/", (req, res) => {
  res.send("✅ API is up. Try GET /users");
});

// step 5 CRUD Routes (Users)
//method post
app.post("/users", async (req, res, next) => {
    try{
        const {name, email, age} = req.body;
        if (!name || !email) res.status(400).json({message : "Name and Email are required"});

        const user = await User.create({name, email, age});
        res.status(200).json(user);     // created resourse
    } catch (err) {
        //handle duplicate email
        if (err.code === 1100) return res.status(409).json({message : "Email already exist"});
        next(err);
    }
});

//method get
//to get all users
app.get("/users", async (req, res, next) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });    // -1 means fetches the new ones(decending)
        res.json(users);
    } catch(err) {
        next(err);
    }
});

//to get user by id
app.get("users/:id", async (req, res, next) => {
    try{
        const { id } = req.params;    // :something
        if (!isValidId(id)) return res.status(400).json({ message: "Invalid User id"});

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "User not found"});

        res.json(user);
    } catch (err) {
        next(err);
    }
});

// method put
//to update the existing users
app.put("/users/:id", async (req, res, next) => {
    try{
        const { id } = req.params;
        if (!isValidId) return res.status(400).json({message: "Invalid user id"});

        const { name, email, age } = req.body;
        const updated = await User.findByIdAndUpdate(
            id,
            {name, email, age},
            { new: true, runValidators: true},
        );

        if (!updated) return res.status(404).json({message: "User not found"});
        res.json(updated);
    } catch(err){
        if (err.code === 1100) return req.status(400).json({message: "Email already exist"});
        next(err);
    }
});

//method to delete
app.delete("/users/:id", async (req, res, next) => {
    try{
        const { id } = req.params;
        if (!isValidId) return res.status(400).json({message: "Invalid user Id"});

        const deleted = await User.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({message: "User not found"});

        res.json({ message: "User deleted"});
    } catch (err){
        next(err);
    }
});

//step 6 error handlers
app.use((req,res) => {
    res.status(404).json({message: "route not found"});     //for unknown routes
});

//step 7 centralized error handler (catches thrown/passed errors)
app.use((err, req, res, next) => {
    console.log("💥 Error:", err);
    res.status(500).json({message: "Internal Server Issue"});
});

//step 8 connect to the server
app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});