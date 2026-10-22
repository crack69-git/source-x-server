import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { MongoClient } from "mongodb";
import { randomInt } from "crypto";

dotenv.config();
const app = express();
const port = process.env.PORT;
import * as jose from "jose-cjs";
const JWKS = jose.createRemoteJWKSet(
  new URL(`${process.env.BASE_URL_CLIENT}/api/auth/jwks`),
);

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }
  try {
    const { payload } = await jose.jwtVerify(token, JWKS);

    req.user = payload;
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: "Invalid token" });
  }
};
const client = new MongoClient(process.env.MONGODB_URI);

app.use(express.json());
app.use(cors());
import { ObjectId } from "mongodb";

async function run() {
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
    const productsCollection = database.collection("product");
    const cartsCollection = database.collection("cart");
    const ordersCollection = database.collection("order");

    // postCart
    app.post("/api/cart", async (req, res) => {
      try {
        const cart = await cartsCollection.insertOne(req.body);
        res.status(201).json(cart);
      } catch (error) {
        console.error("Error posting cart:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // getProduct
    app.get("/api/all/getProducts", async (req, res) => {
      try {
        const posts = await productsCollection.find({}).toArray();
        res.json(posts);
      } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // deletePost
    app.delete("/api/delete/post/:id", async (req, res) => {
      try {
        const postId = req.params.id;
        const objectId = new ObjectId(postId);
        console.log("Deleting post with ID:", postId, "ObjectId:", objectId);
        const result = await postsCollection.deleteOne({ _id: objectId });
        if (result.deletedCount === 0) {
          return res.status(404).json({ error: "Post not found" });
        }
        res.json({
          message: "Post deleted successfully",
          deletedCount: result.deletedCount,
        });
      } catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // deleteProuct
    app.delete("/api/delete/product/:id", async (req, res) => {
      try {
        const productId = req.params.id;
        const objectId = new ObjectId(productId);
        console.log(
          "Deleting product with ID:",
          productId,
          "ObjectId:",
          objectId,
        );
        const result = await productsCollection.deleteOne({
          _id: objectId,
        });
        if (result.deletedCount === 0) {
          return res.status(404).json({ error: "Product not found" });
        }
        res.json({
          message: "Product deleted successfully",
          deletedCount: result.deletedCount,
        });
      } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // getSingleProduct
    app.get("/api/get/product/:id", async (req, res) => {
      try {
        const productId = req.params.id;
        const product = await productsCollection.findOne({
          productCode: productId,
        });
        if (!product) {
          return res.status(404).json({ error: "Product not found" });
        }
        res.json(product);
      } catch (error) {
        console.error("Error fetching product:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // getProducts

    app.get("/api/get/products", async (req, res) => {
      try {
        const { name, category } = req.query;
        const query = {};

        // Search by product name (partial, case-insensitive)
        if (typeof name === "string" && name.trim()) {
          const escapedName = name
            .trim()
            .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

          query.productName = {
            $regex: escapedName,
            $options: "i",
          };
        }

        // Filter by category
        if (
          typeof category === "string" &&
          category.trim() &&
          category !== "all"
        ) {
          query.productCategory = category.trim();
        }

        const products = await productsCollection.find(query).toArray();

        return res.status(200).json(products);
      } catch (error) {
        console.error("Error fetching products:", error);

        return res.status(500).json({
          error: "Internal Server Error",
        });
      }
    });

    // postProduct

    app.post("/api/post/product", async (req, res) => {
      try {
        const productData = req.body;
        console.log("Received product data:", productData);
        let product;
        let productCode;
        while (true) {
          const randomNumber = randomInt(100000, 1000000);
          productCode = `SX-${randomNumber}`;
          try {
            const data = {
              ...productData,
              productCode: productCode,
            };
            product = await productsCollection.insertOne(data);
            console.log("Inserted product:", product);
            break;
          } catch (error) {
            if (error.code === 11000) {
              console.log(
                `Product code ${productCode} already exists. Generating another...`,
              );

              continue;
            }
            throw error;
          }
        }

        res.status(201).json({
          success: true,
          message: "Product posted successfully",
          productCode: productCode,
          product: product,
        });
      } catch (error) {
        console.error("Error posting product:", error);

        res.status(500).json({
          success: false,
          error: "Internal Server Error",
        });
      }
    });

    // getSupplierById
    app.get("/api/supplier/single/:id", verifyToken, async (req, res) => {
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
    app.post("/api/supplier", verifyToken, async (req, res) => {
      try {
        const supplier = await suppliersCollection.insertOne(req.body);
        res.status(201).json(supplier);
      } catch (error) {
        console.error("Error posting supplier:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // patchDeliveryStatus
    app.patch(
      "/api/updateDeliveryStatus/:id",
      verifyToken,
      async (req, res) => {
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
      },
    );

    // s
    app.patch("/api/updatePostStatus/:id", verifyToken, async (req, res) => {
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
    app.get("/api/getPosts/:id", verifyToken, async (req, res) => {
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
    app.get("/api/getPosts", verifyToken, async (req, res) => {
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
    app.post("/api/requirements", verifyToken, async (req, res) => {
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
    // return client;
  } catch (err) {
    console.dir(err);
    return null;
  }
}
run();
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
