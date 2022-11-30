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
        // const categoryCollection = client.db("salesexpress").collection("mobilecollection");
        const mobileCollection = client.db("salesexpress").collection("allmobilebycategory");

        const advertisementCollection = client.db("salesexpress").collection("advertise");
        const wishListCollection = client.db("salesexpress").collection("wishlist");
        const ordersCollection = client.db("salesexpress").collection("orders");
        const usersCollection = client.db("salesexpress").collection("users");
        const sellersCollection = client.db("salesexpress").collection("sellers");
        const paymentsCollection = client.db("usalesexpress").collection("payments");


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
                console.log(filteredOrder)
            })

            res.send(filtered);
        });
        app.get("/phones/:id", async (req, res) => {
            const id = req.params.id;
            const result = { category_id: id };
            const filtered = await mobileCollection.find(result).toArray();
            res.send(filtered)
        });

        app.get("/addedbyseller", async (req, res) => {
            const email = req.query.email;
            const queryByEmailForSeller = { email: email };
            const orders = await mobileCollection.find(queryByEmailForSeller).toArray();
            res.send(orders)
        });


        // phones....
        app.post("/phones", verifyJWT, async (req, res) => {
            const phones = req.body;
            const result = await mobileCollection.insertOne(phones);
            res.send(result);
        });

        // advertisement...
        app.post("/advertise", async (req, res) => {
            const phones = req.body;
            const id = phones._id;
            const query = {
                _id: ObjectId(id),
                stock: phones.stock,
                email: phones.email,
            }
            const filter = { _id: ObjectId(id) };
            const updatedDoc = {
                $set: {
                    advertised: true,
                }
            }
            const updateFilter = await advertisementCollection.updateOne(filter, updatedDoc)
            const available = await advertisementCollection.find(query).toArray();
            if (available.length) {
                const message = `You have already a advertised for this item`;
                return res.send({ acknowledged: false, message });
            }
            console.log(available)
            const result = await advertisementCollection.insertOne(phones);
            res.send(result);
        });

        app.get('/advertise', async (req, res) => {
            const query = {};
            const phone = await advertisementCollection.find(query).toArray();
            res.send(phone);
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
            console.log(available)
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


        // orders....
        app.get("/orders", async (req, res) => {
            const email = req.query.email;
            console.log(req.headers.authorization)
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res
                    .status(403)
                    .send({ message: "Forbidden Access from if" });
            }

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
                const message = `You already have a booking for ${order.MobileName}, BookingID: ${order.orderId} `;
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
            res.status(403).send({ accessToken: "No Available Token For You" });
        });


        // Users....
        app.post("/usersall", async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        app.get("users/admin/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === "admin" });
        });
        app.get("users/seller/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollection.findOne(query);
            res.send({ isSeller: user?.role === "seller" });
        });
        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users)

            app.delete("/users/:id", async (req, res) => {
                const id = req.params.id;
                const query = { _id: ObjectId(id) };
                const result = await usersCollection.deleteOne(query);
                res.send(result);
            });
        })

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