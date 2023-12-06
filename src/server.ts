import cors from "cors";
import dotenv from "dotenv";
import express, { Application, Request, Response } from "express";
import { Db, InsertOneResult, MongoClient, ObjectId, ServerApiVersion, UpdateResult } from "mongodb";
import morgan from "morgan";

dotenv.config();
const app: Application = express();
const { PORT, DATABASE_URL, DATABASE_NAME } = process.env;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

const client = new MongoClient(DATABASE_URL as string, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Database Connection
    await client.db(DATABASE_NAME).command({ ping: 1 });
    console.log("Database connected successfully!");

    // Database Collection
    const db: Db = client.db(DATABASE_NAME);
    const bookCollection = db.collection("books");
    const userCollection = db.collection("users");

    // API endpoints
    app.post("/books", async (req: Request, res: Response) => {
      const book = req.body;
      const result = await bookCollection.insertOne(book);

      res.send(result);
    });

    app.get("/books", async (req, res) => {
      const { search, genre, publicationYear } = req.query;

      const andConditions: Record<string, unknown>[] = [];

      if (search) {
        andConditions.push({
          $or: ["title", "author", "genre"].map((field) => {
            return {
              [field]: {
                $regex: search,
                $options: "i",
              },
            };
          }),
        });
      }

      const filterConditions: Record<string, unknown>[] = [];
      if (genre) {
        filterConditions.push({
          genre: {
            $regex: genre,
          },
        });
      }
      if (publicationYear) {
        filterConditions.push({
          publicationDate: {
            $regex: publicationYear,
          },
        });
      }

      if (filterConditions.length) {
        andConditions.push({
          $and: filterConditions,
        });
      }

      const whereConditions = andConditions.length ? { $and: andConditions } : {};

      const books = bookCollection.find(whereConditions);
      const result = await books.toArray();

      res.send(result);
    });

    app.get("/recently-added-books", async (req, res) => {
      const books = bookCollection.find({}).sort({ _id: -1 }).limit(10);
      const result = await books.toArray();

      res.send(result);
    });

    app.get("/books/:id", async (req, res) => {
      const { id } = req.params;
      const result = await bookCollection.findOne({ _id: new ObjectId(id) });

      res.send(result);
    });

    app.patch("/books/:id", async (req: Request, res: Response) => {
      const { id } = req.params;
      const book = req.body;

      const result = await bookCollection.updateOne({ _id: new ObjectId(id) }, { $set: book });

      res.send(result);
    });

    app.delete("/books/:id", async (req, res) => {
      const { id } = req.params;

      const result = await bookCollection.deleteOne({ _id: new ObjectId(id) });

      res.send(result);
    });

    app.post("/reviews/:id", async (req, res) => {
      const bookId = req.params.id;
      const review = req.body.review;

      const result = await bookCollection.updateOne({ _id: new ObjectId(bookId) }, { $push: { reviews: review } });

      if (result.modifiedCount !== 1) {
        res.json({ error: "Book not found or review not added" });
        return;
      }

      res.json({ message: "Review added successfully" });
    });

    app.get("/reviews/:id", async (req, res) => {
      const bookId = req.params.id;

      const result = await bookCollection.findOne(
        { _id: new ObjectId(bookId) },
        { projection: { _id: 0, reviews: 1 } }
      );

      if (result) {
        res.json(result);
      } else {
        res.status(404).json({ error: "Book not found" });
      }
    });

    app.post("/users/:email", async (req, res) => {
      const { email } = req.params;
      const { book, status } = req.body;
      let result: UpdateResult<Document> | InsertOneResult<Document>;

      const user = await userCollection.findOne({ user: email });

      if (user) {
        result = await userCollection.updateOne(
          { user: email, "wishlist.book": book },
          { $set: { "wishlist.$.status": status } }
        );

        if (!result.matchedCount) {
          result = await userCollection.updateOne(
            { user: email, "wishlist.book": { $ne: book } },
            { $addToSet: { wishlist: req.body } }
          );
        }
      } else {
        result = await userCollection.insertOne({
          user: email,
          wishlist: [req.body],
        });
      }

      res.json(result);
    });
  } finally {
  }
}

run().catch((error) => {
  console.error("Failed to connect database!", error);
});

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to Book Catalog!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
