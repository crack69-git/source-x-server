const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");

dotenv.config();

const app = express();

const mongoClient = new MongoClient(process.env.MONGODB_URI);

app.use(express.json());
app.use(cors());

/* --------------------------------
   MongoDB Connection
-------------------------------- */

let dbPromise = null;

async function getDatabase() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not set");
  }

  if (!dbPromise) {
    dbPromise = mongoClient.connect().then(() => {
      console.log("Successfully connected to MongoDB!");

      return mongoClient.db(process.env.MONGODB_DB);
    });
  }

  return dbPromise;
}

/* --------------------------------
   Root Route
-------------------------------- */

app.get("/", (req, res) => {
  res.json({
    message: "Task 13 server is running",
  });
});

/* --------------------------------
   Get Supplier By ID
-------------------------------- */

app.get("/api/supplier/single/:id", async (req, res) => {
  try {
    const database = await getDatabase();
    const suppliersCollection = database.collection("supplier");

    const supplierId = req.params.id;

    console.log("Fetching supplier with ID:", supplierId);

    const supplier = await suppliersCollection.findOne({
      productId: supplierId,
    });

    console.log("Fetched supplier:", supplier);

    if (!supplier) {
      return res.status(404).json({
        error: "Supplier not found",
      });
    }

    res.json(supplier);
  } catch (error) {
    console.error("Error fetching supplier:", error);

    res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

/* --------------------------------
   Post Supplier
-------------------------------- */

app.post("/api/supplier", async (req, res) => {
  try {
    const database = await getDatabase();
    const suppliersCollection = database.collection("supplier");

    const supplier = await suppliersCollection.insertOne(req.body);

    res.status(201).json(supplier);
  } catch (error) {
    console.error("Error posting supplier:", error);

    res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

/* --------------------------------
   Update Delivery Status
-------------------------------- */

app.patch("/api/updateDeliveryStatus/:id", async (req, res) => {
  try {
    const database = await getDatabase();
    const postsCollection = database.collection("post");

    const postId = req.params.id;

    console.log("Updating delivery status for post ID:", postId);

    if (!ObjectId.isValid(postId)) {
      return res.status(400).json({
        error: "Invalid post ID",
      });
    }

    const objectId = new ObjectId(postId);

    const { delivaryStatus } = req.body;

    console.log("New delivery status:", delivaryStatus);

    const result = await postsCollection.updateOne(
      { _id: objectId },
      {
        $set: {
          delivaryStatus,
        },
      },
    );

    console.log("Update result:", result);

    if (result.matchedCount === 0) {
      return res.status(404).json({
        error: "Post not found",
      });
    }

    res.json({
      message: "Delivery status updated successfully",
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error updating delivery status:", error);

    res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

/* --------------------------------
   Update Post Status
-------------------------------- */

app.patch("/api/updatePostStatus/:id", async (req, res) => {
  try {
    const database = await getDatabase();
    const postsCollection = database.collection("post");

    const postId = req.params.id;

    if (!ObjectId.isValid(postId)) {
      return res.status(400).json({
        error: "Invalid post ID",
      });
    }

    const objectId = new ObjectId(postId);

    const { status } = req.body;

    const result = await postsCollection.updateOne(
      { _id: objectId },
      {
        $set: {
          status,
        },
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        error: "Post not found",
      });
    }

    res.json({
      message: "Post status updated successfully",
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error updating post status:", error);

    res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

/* --------------------------------
   Get Post By ID
-------------------------------- */

app.get("/api/getPosts/:id", async (req, res) => {
  try {
    const database = await getDatabase();
    const postsCollection = database.collection("post");

    const postId = req.params.id;

    if (!ObjectId.isValid(postId)) {
      return res.status(400).json({
        error: "Invalid post ID",
      });
    }

    const objectId = new ObjectId(postId);

    const post = await postsCollection.findOne({
      _id: objectId,
    });

    if (!post) {
      return res.status(404).json({
        error: "Post not found",
      });
    }

    res.json(post);
  } catch (error) {
    console.error("Error fetching post:", error);

    res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

/* --------------------------------
   Get All Posts
-------------------------------- */

app.get("/api/getPosts", async (req, res) => {
  try {
    const database = await getDatabase();
    const postsCollection = database.collection("post");

    const posts = await postsCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);

    res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

/* --------------------------------
   Post Requirements
-------------------------------- */

app.post("/api/requirements", async (req, res) => {
  try {
    const database = await getDatabase();
    const postsCollection = database.collection("post");

    const requirement = await postsCollection.insertOne(req.body);

    res.status(201).json(requirement);
  } catch (error) {
    console.error("Error posting requirement:", error);

    res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

/* --------------------------------
   Get User By ID
-------------------------------- */

app.get("/api/users/:id", async (req, res) => {
  try {
    const database = await getDatabase();
    const usersCollection = database.collection("user");

    const userId = req.params.id;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({
        error: "Invalid user ID",
      });
    }

    const objectId = new ObjectId(userId);

    const user = await usersCollection.findOne({
      _id: objectId,
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);

    res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

module.exports = app;
