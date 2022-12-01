const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        return res.status(401).send("Access Denied")
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
        const mobileCollection = client.db("salesexpress").collection("allmobilebycategory");
        const wishListCollection = client.db("salesexpress").collection("wishlist");
        const ordersCollection = client.db("salesexpress").collection("orders");
        const usersCollection = client.db("salesexpress").collection("users");
        const reportsCollection = client.db("salesexpress").collection("report");
        const sellersCollection = client.db("salesexpress").collection("sellers");
        const paymentsCollection = client.db("usalesexpress").collection("payments");
        const advertisementCollection = client.db("salesexpress").collection("advertise");


        const verifyAdmin = async (req, res, next) => {
            console.log("inside admin verify", req.decoded.email);
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);
            if (user?.role !== "admin") {
                return res.status(403).send({ message: "Forbidden Access" });
            }
            next();
        };
        const verifySeller = async (req, res, next) => {
            console.log("inside seller verify", req.decoded.email);
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);
            if (user?.role !== "seller") {
                return res.status(403).send({ message: "Forbidden Access" });
            }
            next();
        };


        app.get("/phones", async (req, res) => {
            const id = req.params.id;
            const query = {};
            const filtered = await mobileCollection.find(query).toArray();
            const orderQuery = { orderId: id };
            const email = req.query.email;
            const queryByEmailForSeller = { email: email };
            const orders = await mobileCollection.find(queryByEmailForSeller).toArray();
            const alreadyordered = await ordersCollection.find(orderQuery).toArray();
            filtered.forEach(fil => {
                const filteredOrder = alreadyordered.filter(order => order.orderId === fil.orderId)
            })

            res.send(filtered);
        });
        app.get("/phones/:id", async (req, res) => {
            const id = req.params.id;
            const result = { category_id: id };
            const filtered = await mobileCollection.find(result).toArray();
            res.send(filtered)
        });

        app.get("/sellersproduct", async (req, res) => {
            const email = req.query.email;
            const queryByEmailForSeller = { email: email };
            const orders = await mobileCollection.find(queryByEmailForSeller).toArray();
            res.send(orders)
        });


        // phones....
        app.post("/phones", async (req, res) => {
            const phones = req.body;
            console.log('inside phones', phones)
            const result = await mobileCollection.insertOne(phones);
            res.send(result);
        });


        // wishlist.....
        app.post("/wishlist", async (req, res) => {
            const phones = req.body;
            const id = phones._id;

            const query = {
                _id: new ObjectId(id),
                email: phones.email,
            }
            console.log(phones, id, query)
            const available = await wishListCollection.find(query).toArray();
            if (available.length) {
                const message = `You have already added to wishlist this item`;
                return res.send({ acknowledged: false, message });
            }
            const result = await wishListCollection.insertOne(phones);
            res.send(result);

        });

        app.get("/wishlist", async (req, res) => {
            const email = req.query.email;
            console.log(req.headers.authorization);
            const query = { email: email };
            const orders = await wishListCollection.find(query).toArray();
            res.send(orders);

        });

        // Reports
        app.post("/reports", async (req, res) => {
            const phones = req.body;
            const id = phones._id;

            const query = {
                _id: new ObjectId(id),
                email: phones.email,
            }
            console.log(phones, id, query)
            const available = await reportsCollection.find(query).toArray();
            if (available.length) {
                const message = `You have reported this Item Already`;
                return res.send({ acknowledged: false, message });
            }
            console.log(available)
            const result = await reportsCollection.insertOne(phones);
            res.send(result);

        });

        app.delete("/reports/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await reportsCollection.deleteOne(query);
            res.send(result);
        });

        app.get("/reports", async (req, res) => {
            const email = req.query.email;
            console.log(req.headers.authorization);
            const query = { email: email };
            const orders = await reportsCollection.find(query).toArray();
            res.send(orders);

        });


        // orders....
        app.get("/orders", async (req, res) => {
            const email = req.query.email;
            console.log(req.headers.authorization)
            // const decodedEmail = req.decoded.email;
            // if (email !== decodedEmail) {
            //     return res
            //         .status(403)
            //         .send({ message: "Forbidden Access from if" });
            // }

            const query = { email: email };
            console.log(email);
            const order = await ordersCollection.find(query).toArray();
            res.send(order);
        });

        app.post("/orders", async (req, res) => {
            const order = req.body;
            const query = {
                Order_id: order.Order_id,
                email: order.email,
            };

            const alreadyordered = await ordersCollection.find(query).toArray();
            if (alreadyordered.length) {
                const message = `You already have a booking for ${order.MobileName}`;
                return res.send({ acknowledged: false, message });
            }
            const result = await ordersCollection.insertOne(order);
            res.send(result);

        });


        // JWT...
        app.get("/jwt", async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user && user?.email) {
                const token = jwt.sign({ email }, process.env.DB_ACCESS_TOken, {
                    expiresIn: "23h",
                });
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: "Restricted Access" });
        });


        // Users....
        app.post("/usersall", async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        app.get("/users/admin/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === "admin" });
        });
        app.get("/users/seller/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email };
            console.log('inside seller api', query)
            const user = await usersCollection.findOne(query);
            console.log(user, email)
            res.send({ isSeller: user?.role === "seller" });
        });
        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users)
        })
        app.delete("/users/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(query);
            res.send(result);
        });

    } finally {
    }
}

run()
    .catch(err => console.error(err))

app.get('/', (req, res) => {
    res.send('Server is functioning')
})

app.listen(port, () => {
    console.log(`Server is functioning on ${port}`)
})