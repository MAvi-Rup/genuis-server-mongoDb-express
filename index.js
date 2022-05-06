const express = require("express");
const cors = require('cors');
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { decoded } = require("jsonwebtoken");
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

//middleware
app.use(cors());
app.use(express.json());

function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token,process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' })
        }
        console.log('decoded', decoded)
        req.decoded = decoded;
        next();

    })

   
}



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.avjko.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        await client.connect();
        const serviceCollection = client.db('genius-car').collection('service');

        const orderCollection = client.db('genuis-car').collection('order')

        //AUTH
        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN, {
                expiresIn: '1d'
            });
            res.send(accessToken)
        })



        //All Data Load
        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query)
            const services = await cursor.toArray();
            res.send(services)
        })
        // Single data load

        app.get('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const service = await serviceCollection.findOne(query)
            res.send(service)
        })

        // POST A SERVICE

        app.post('/service', async (req, res) => {
            const newService = req.body;
            const result = await serviceCollection.insertOne(newService)
            res.send(result)

        })


        //Order collection Api

        app.post('/order', async (req, res) => {
            // const decodedEmail = req.decoded.email;

            const order = req.body;
            const result = await orderCollection.insertOne(order)
            res.send(result)

        })

        //Get all order Api

        app.get('/order', verifyToken, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            if (email == decodedEmail) {
                const query = { email: email }
                const cursor = orderCollection.find(query)
                const order = await cursor.toArray()
                res.send(order)
            }else{
                res.status(403).send({message: 'Forbidden'})
            }

        })

        //Delete API 

        app.delete('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await serviceCollection.deleteOne(query);
            res.send(result)
        })
    }
    finally {

    }

}

run().catch(console.dir)



//server starting default page
app.get('/', (req, res) => {
    res.send("Genius Server")
})

//server starting 

app.listen(port, () => {
    console.log('Listening from port', port)
})

