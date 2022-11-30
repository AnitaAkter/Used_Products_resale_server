const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()

const app = express()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

const uri = "mongodb+srv://anita12:8IZacJ7gJIj4XeLy@cluster0.uxgzc97.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send("Unauthorized Access.Why do you searching it?")
    }
    const token = authHeader.split("")[1];
    jwt.verify(token, process.env.DB_ACCESS_TOken, function (error, decoded) {
        if (error) {
            return res.status(403).send({ message: "Forbidden Access" });
        }
        req.decoded = decoded;
        next();
    });
}


async function run() {
    try {
        const categoryCollection = client.db("salesexpress").collection("mobilecollection");
        // const mobileCollection = client.db("salesexpress").collection("allmobilebycategory");

        // const advertisementCollection=client.db("salesexpress").collection("advertise");
        // const wishListCollection=client.db("salesexpress").collection("wishlist");
        const ordersCollection = client.db("salesexpress").collection("orders");
        const usersCollection = client.db("salesexpress").collection("users");
        const sellersCollection = client.db("salesexpress").collection("sellers");
        const paymentsCollection = client.db("usalesexpress").collection("payments");


        app.get("/phones", async (req, res) => {
            const id = req.params.id;
            const query = {};
            const filtered = await categoryCollection.find(query).toArray();
            const orderQuery = { orderId: id };
            const email = req.query.email;
            const queryByEmailForSeller = { email: email };
            const orders = await categoryCollection.find(queryByEmailForSeller).toArray();
            const alreadyordered = await ordersCollection.find(orderQuery).toArray();
            filtered.forEach(fil => {
                const filteredOrder = alreadyordered.filter(order => order.orderId === fil.orderId)
                console.log(filteredOrder)
            })

            res.send(filtered);
        });
        app.get("/phones/:id", async (req, res) => {
            const id = req.params.id;
            const result = { category_id: id };
            const filtered = await categoryCollection.find(result).toArray();
            res.send(filtered)
        });

        app.get("/phonesbycategory", async (req, res) => {
            const query = {};
            const filtered = await mobileCollection.find(query).toArray();
            res.send(filtered);
        });

        app.get("/orders", async (req, res) => {
            const email = req.query.email;

            const query = { email: email };
            console.log(email);
            const order = await ordersCollection.find(query).toArray();
            res.send(order);
        });

        app.post("/orders", async (req, res) => {
            const order = req.body;
            const query = {
                orderId: order.orderId,
                email: order.email,
            };
            console.log(order);
            const alreadyordered = await ordersCollection.find(query).toArray();
            if (alreadyordered.length) {
                const message = `You already have a booking for ${order.MobileName}, BookingID: ${order.orderId} `;
                return res.send({ acknowledged: false, message });
            }
            const result = await ordesrCollection.insertOne(order);
            res.send(result);

        });
    } finally {
    }
}

run().catch(err => console.error(err))

app.get('/', (req, res) => {
    res.send('Server is running...')
})

app.listen(port, () => {
    console.log(`Server is running on ${port}`)
})