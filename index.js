const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { MongoClient } = require("mongodb");

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const client = new MongoClient(process.env.MONGODB_URI);

app.use(express.json());
app.use(cors());
const { ObjectId } = require("mongodb");

async function connectToMongoDB() {
  if (!process.env.MONGODB_URI) {
    console.warn("MONGODB_URI is not set. Skipping MongoDB connection.");
    return null;
  }

  try {
    await client.connect();
    const database = client.db(process.env.MONGODB_DB);
    const usersCollection = database.collection("user");

    // getUserById
    app.get("/api/users/:id", async (req, res) => {
      try {
        const userId = req.params.id;
        const objectId = new ObjectId(userId);
        const user = await usersCollection.findOne({ _id: objectId });
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        res.json(user);
      } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
    return null;
  }
}

app.get("/", (req, res) => {
  res.send("Hello World!");
});

connectToMongoDB();

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
