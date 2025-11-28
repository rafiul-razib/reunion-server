const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;

// MongoDB
const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = process.env.URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB!");

    const database = client.db("reunionCpscmDb");
    const allMembersCollection = database.collection("allMembers");

    // ---------------------------
    //         ROUTES
    // ---------------------------

    // Fetch all registered members
    app.get("/allRegisteredMembers", async (req, res) => {
      try {
        const result = await allMembersCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Error fetching members" });
      }
    });

    // (Optional) Add member
    app.post("/addMember", async (req, res) => {
      try {
        const newMember = req.body;
        const result = await allMembersCollection.insertOne(newMember);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Error adding member" });
      }
    });

  } finally {
    // keeping the connection open for server lifetime
  }
}

run().catch(console.dir);

// Root endpoint
app.get("/", (req, res) => {
  res.send("Reunion Server is Running!!");
});

// Run server
app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
