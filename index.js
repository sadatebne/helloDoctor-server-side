const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.PORT || 3000
//dotenv
require('dotenv').config()

const stripe = require("stripe")(process.env.PAYMENT_KEY);

//middle-ware
app.use(cors())
app.use(express.json())


//DB

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const req = require('express/lib/request')
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rsw32ip.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const doctorCollection = client.db("helloDoctorDB").collection("doctors");
        const userCollection = client.db("helloDoctorDB").collection("users");
        const paymentCollection = client.db("helloDoctorDB").collection("payments");

        app.post('/users', async (req, res) => {
            const users = req.body
            const query = { email: users.email }
            const existingUser = await userCollection.findOne(query)
            if (existingUser) {
                return res.send({ message: 'user exist' })
            }
            const result = await userCollection.insertOne(users)
            res.send(result)
        })

        app.get("/doctors", async (req, res) => {
            const result = await doctorCollection.find().toArray()
            res.send(result)
        })

        app.get('/doctor/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await doctorCollection.find(query).toArray()
            res.send(result)
        })

        //payment
        app.post("/create-payment-intent", async (req, res) => {
            const { price } = req.body;
            const amount = price * 100
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                "payment_method_types": [
                    "card"
                  ],
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
              });
        })

        app.post('/payment', async(req, res)=>{
          const payment= req.body
          const result= await paymentCollection.insertOne(payment)
          res.send(result)
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        //await client.close();
    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send("Doctor Says Hi")
})

app.listen(port, () => {
    console.log("server is running", port)
})