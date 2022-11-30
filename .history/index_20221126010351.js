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
        const categoryCollection = client.db("usedmobile").collection("mobile");
        const mobileCollection = client.db("usedmobile").collection("allmobilebycategory");

        const bookingsCollection = client.db("usedmobile").collection("bookings");
        const usersCollection = client.db("usedmobile").collection("users");
        const sellersCollection = client.db("usedmobile").collection("sellers");
        const paymentsCollection = client.db("usedmobile").collection("payments");