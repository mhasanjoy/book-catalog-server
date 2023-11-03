import cors from "cors";
import dotenv from "dotenv";
import express, { Application, Request, Response } from "express";
import { Db, MongoClient, ObjectId, ServerApiVersion } from "mongodb";
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

    // API endpoints
    app.post("/books", async (req: Request, res: Response) => {
      const book = req.body;
      const result = await bookCollection.insertOne(book);

      res.send(result);
    });

    app.get("/books", async (req, res) => {
      const { search } = req.query;

      const searchConditions = {
        $or: [
          {
            title: {
              $regex: search,
              $options: "i",
            },
          },
          {
            author: {
              $regex: search,
              $options: "i",
            },
          },
          {
            genre: {
              $regex: search,
              $options: "i",
            },
          },
        ],
      };

      const books = bookCollection.find(searchConditions);
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
