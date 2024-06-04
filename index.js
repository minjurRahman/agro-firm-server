const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
//const { default: OpenAI } = require('openai');
const jwt = require("jsonwebtoken")
const app = express()
const port = 5000

// Middle wire
app.use(cors())
app.use(express.json()) //client site theke jei data gulo pabo ta jeno json formate nite pari

//Mongodb
const uri = "mongodb+srv://minjurrahaman:bWC5ynnNfND1Kni0@cluster0.gwtkwvj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

//Token
function createToken(user) {
    const token = jwt.sign(
        {
            email: user.email
        },
        'secret',
        { expiresIn: '90d' }
    );
    return token;
}

// Token verify midel ware
function verifyToken(req, res, next) {
    const token = req.headers.authorization.split(' ')[1];

    const verify = jwt.verify(token, 'secret');
    console.log(token);
    console.log(verify)
    if (!verify?.email) {
        return res.send('You are not authorized')
    }
    req.user = verify.email;
    next()
}

/* // Assign API key to variable
const apiKey = process.env.VITE_OPEN_AI_KEY;
// Initialise OpenAI API
const openai = new OpenAI({ apiKey: apiKey }); */

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        //creating database
        const productDB = client.db("productDB");
        const userDB = client.db("userDB");
        const shoesCollection = productDB.collection("shoesCollection");
        const userCollection = userDB.collection("userCollection");

        // Product routes
        app.post("/shoes", verifyToken, async (req, res) => {
            const shoesData = req.body;
            const result = await shoesCollection.insertOne(shoesData);
            res.send(result)

        })
        // All data find
        app.get("/shoes", async (req, res) => {
            const shoesData = shoesCollection.find();
            const result = await shoesData.toArray();
            res.send(result)

        })

        // Single Data find
        app.get("/shoes/:id", async (req, res) => {
            const id = req.params.id;
            const shoesData = await shoesCollection.findOne({ _id: new ObjectId(id) });
            res.send(shoesData)

        })
        //Update Products
        app.patch("/shoes/:id", verifyToken, async (req, res) => {
            const id = req.params.id;
            const updatedData = req.body;
            const result = await shoesCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updatedData }
            );
            res.send(result)
        })
        // Delete product
        app.delete("/shoes/:id", verifyToken, async (req, res) => {
            const id = req.params.id;
            const result = await shoesCollection.deleteOne(
                { _id: new ObjectId(id) },
            );
            res.send(result)
        })

        // User Routes
        // user created 
        app.post('/user', async (req, res) => {
            const user = req.body;
            const token = createToken(user)
            console.log(token)
            const isUserExist = await userCollection.findOne({ email: user?.email })
            if (isUserExist?._id) {
                return res.send({
                    status: "Success",
                    message: "Login success",
                    token
                })
            }
            await userCollection.insertOne(user);
            res.send({ token })
        })

        // User get
        //edit page
        app.get('/user/get/:id', async (req, res) => {
            const id = req.params.id;
            const result = await userCollection.findOne({ _id: new ObjectId(id) })
            res.send(result)
        })
        //profile page
        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            const result = await userCollection.findOne({ email })
            res.send(result)
        })
        //profile Update
        app.patch('/user/:email', async (req, res) => {
            const email = req.params.email;
            const UserUpdatedData = req.body;
            const result = await userCollection.updateOne({ email }, { $set: UserUpdatedData }, { upsert: true })
            res.send(result)
        })

        console.log("Successfully connected to MongoDB!");
    } finally {

    }
}
run().catch(console.log);




app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})



//user: minjurrahaman
// pass: bWC5ynnNfND1Kni0
