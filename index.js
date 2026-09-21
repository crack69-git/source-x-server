const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { MongoClient } = require("mongodb");

dotenv.config();

const app = express();
const port = process.env.PORT;
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
    // await client.connect();
    const database = client.db(process.env.MONGODB_DB);
    const usersCollection = database.collection("user");
    const postsCollection = database.collection("post");
    const suppliersCollection = database.collection("supplier");

    // getSupplierById
    app.get("/api/supplier/single/:id", async (req, res) => {
      try {
        const supplierId = req.params.id;
        console.log("Fetching supplier with ID:", supplierId);

        const supplier = await suppliersCollection.findOne({
          productId: supplierId,
        });
        console.log("Fetched supplier:", supplier);
        if (!supplier) {
          return res.status(404).json({ error: "Supplier not found" });
        }
        res.json(supplier);
      } catch (error) {
        console.error("Error fetching supplier:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // postSupplier
    app.post("/api/supplier", async (req, res) => {
      try {
        const supplier = await suppliersCollection.insertOne(req.body);
        res.status(201).json(supplier);
      } catch (error) {
        console.error("Error posting supplier:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // patchDeliveryStatus
    app.patch("/api/updateDeliveryStatus/:id", async (req, res) => {
      try {
        const postId = req.params.id;
        console.log("Updating delivery status for post ID:", postId);
        const objectId = new ObjectId(postId);
        const { delivaryStatus } = req.body;
        console.log("New delivery status:", delivaryStatus);
        const result = await postsCollection.updateOne(
          { _id: objectId },
          { $set: { delivaryStatus } },
        );
        console.log("Update result:", result);
        if (result.matchedCount === 0) {
          return res.status(404).json({ error: "Post not found" });
        }
        res.json({
          message: "Delivery status updated successfully",
          matchedCount: result.matchedCount,
          modifiedCount: result.modifiedCount,
        });
      } catch (error) {
        console.error("Error updating delivery status:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // patchPostStatus
    app.patch("/api/updatePostStatus/:id", async (req, res) => {
      try {
        const postId = req.params.id;
        const objectId = new ObjectId(postId);
        const { status } = req.body;
        const result = await postsCollection.updateOne(
          { _id: objectId },
          { $set: { status } },
        );
        if (result.matchedCount === 0) {
          return res.status(404).json({ error: "Post not found" });
        }
        res.json({
          message: "Post status updated successfully",
          matchedCount: result.matchedCount,
          modifiedCount: result.modifiedCount,
        });
      } catch (error) {
        console.error("Error updating post status:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // getPostsById
    app.get("/api/getPosts/:id", async (req, res) => {
      try {
        const postId = req.params.id;
        const objectId = new ObjectId(postId);
        const post = await postsCollection.findOne({ _id: objectId });
        if (!post) {
          return res.status(404).json({ error: "Post not found" });
        }
        res.json(post);
      } catch (error) {
        console.error("Error fetching post:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // getPosts
    app.get("/api/getPosts", async (req, res) => {
      try {
        const posts = await postsCollection
          .find({})
          .sort({ createdAt: -1 })
          .toArray();
        res.json(posts);
      } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // postRequirements
    app.post("/api/requirements", async (req, res) => {
      try {
        const requirement = await postsCollection.insertOne(req.body);
        res.status(201).json(requirement);
      } catch (error) {
        console.error("Error posting requirement:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

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
