import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { version } from 'os';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());




// 1. Use this simplified URI format (replace <db_password>)
const { MongoClient, ServerApiVersion } = require('mongodb');
const DB_URI = "mongodb+srv://LawrenceVelilla:@CompSci232004@unplanned.n2oap9y.mongodb.net/unplanned?retryWrites=true&w=majority";

const client = new MongoClient(DB_URI, {
    serverApi:{
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,

    }
});
async function run() {
    try {
        // Connect the client to the server (optional starting in v4.7)
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}
run().catch(console.dir);
