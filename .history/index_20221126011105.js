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

async function run() {
    try {
        const categoryCollection = client.db("salesexpress").collection("mobilecollection");
        // const mobileCollection = client.db("salesexpress").collection("allmobilebycategory");

        const ordersCollection = client.db("salesexpress").collection("orders");
        const usersCollection = client.db("salesexpress").collection("users");
        const sellersCollection = client.db("salesexpress").collection("sellers");
        const paymentsCollection = client.db("usalesexpress").collection("payments");


        app.get("/mobiles", async (req, res) => {
            const id = req.params.id;
            const query = {};
            const filtered = await categoryCollection.find(query).toArray();
            const orderQuery = { orderId: id };
            const alreadyordered = await ordersCollection.find(orderQuery).toArray();
            filtered.forEach(fil => {
                const filteredOrder = alreadyordered.filter(order => order.orderId === fil.orderId)
                console.log(filteredOrder)
            })

            res.send(filtered);
        });
        app.get("/mobiles/:id", async (req, res) => {
            const id = req.params.id;
            const result = { category_id: id };
            const filtered = await categoryCollection.find(result).toArray();
            res.send(filtered)
        });

        app.get("/mobilesbycategory", async (req, res) => {
            const query = {};
            const cursor = await mobileCollection.find(query).toArray();
            res.send(cursor);
        });

