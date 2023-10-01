import cors from "cors";
import dotenv from "dotenv";
import express, { Application, Request, Response } from "express";
import { Db, MongoClient, ServerApiVersion } from "mongodb";
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
  } finally {
    await client.close();
  }
}

run().catch((error) => {
  console.error("Failed to connect database!", error);
});

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
