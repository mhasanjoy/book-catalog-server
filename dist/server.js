"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const mongodb_1 = require("mongodb");
const morgan_1 = __importDefault(require("morgan"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const { PORT, DATABASE_URL, DATABASE_NAME } = process.env;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, morgan_1.default)("dev"));
const client = new mongodb_1.MongoClient(DATABASE_URL, {
    serverApi: {
        version: mongodb_1.ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Database Connection
            yield client.db(DATABASE_NAME).command({ ping: 1 });
            console.log("Database connected successfully!");
            // Database Collection
            const db = client.db(DATABASE_NAME);
            const bookCollection = db.collection("books");
            const wishlistCollection = db.collection("wishlist");
            // API endpoints
            app.post("/books", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const book = req.body;
                const result = yield bookCollection.insertOne(book);
                res.send(result);
            }));
            app.get("/books", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const { search, genre, publicationYear } = req.query;
                const andConditions = [];
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
                const filterConditions = [];
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
                const result = yield books.toArray();
                res.send(result);
            }));
            app.get("/recently-added-books", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const books = bookCollection.find({}).sort({ _id: -1 }).limit(10);
                const result = yield books.toArray();
                res.send(result);
            }));
            app.get("/books/:id", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const { id } = req.params;
                const result = yield bookCollection.findOne({ _id: new mongodb_1.ObjectId(id) });
                res.send(result);
            }));
            app.patch("/books/:id", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const { id } = req.params;
                const book = req.body;
                const result = yield bookCollection.updateOne({ _id: new mongodb_1.ObjectId(id) }, { $set: book });
                res.send(result);
            }));
            app.delete("/books/:id", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const { id } = req.params;
                const result = yield bookCollection.deleteOne({ _id: new mongodb_1.ObjectId(id) });
                res.send(result);
            }));
            app.post("/reviews/:id", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const bookId = req.params.id;
                const review = req.body.review;
                const result = yield bookCollection.updateOne({ _id: new mongodb_1.ObjectId(bookId) }, { $push: { reviews: review } });
                if (result.modifiedCount !== 1) {
                    res.json({ error: "Book not found or review not added" });
                    return;
                }
                res.json({ message: "Review added successfully" });
            }));
            app.get("/reviews/:id", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const bookId = req.params.id;
                const result = yield bookCollection.findOne({ _id: new mongodb_1.ObjectId(bookId) }, { projection: { _id: 0, reviews: 1 } });
                if (result) {
                    res.json(result);
                }
                else {
                    res.status(404).json({ error: "Book not found" });
                }
            }));
            app.post("/users/:email/wishlist", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const { email } = req.params;
                const { book, status } = req.body;
                let result;
                const user = yield wishlistCollection.findOne({ user: email });
                if (user) {
                    result = yield wishlistCollection.updateOne({ user: email, "wishlist.book": new mongodb_1.ObjectId(book) }, { $set: { "wishlist.$.status": status } });
                    if (!result.matchedCount) {
                        result = yield wishlistCollection.updateOne({ user: email, "wishlist.book": { $ne: new mongodb_1.ObjectId(book) } }, { $addToSet: { wishlist: { book: new mongodb_1.ObjectId(book), status } } });
                    }
                }
                else {
                    result = yield wishlistCollection.insertOne({
                        user: email,
                        wishlist: [
                            {
                                book: new mongodb_1.ObjectId(book),
                                status,
                            },
                        ],
                    });
                }
                res.json(result);
            }));
            app.get("/users/:email/status/:bookId", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const { email, bookId } = req.params;
                const wishlist = yield wishlistCollection.findOne({ user: email, "wishlist.book": new mongodb_1.ObjectId(bookId) });
                if (wishlist) {
                    const result = wishlist.wishlist.find((list) => list.book.toString() === bookId);
                    res.json(result.status);
                }
                else {
                    res.status(404).json({ error: "Book status not found" });
                }
            }));
            app.get("/users/:email/wishlist", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const { email } = req.params;
                const wishlist = wishlistCollection.aggregate([
                    {
                        $match: {
                            user: email,
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            wishlist: 1,
                        },
                    },
                    {
                        $unwind: "$wishlist",
                    },
                    {
                        $lookup: {
                            from: "books",
                            localField: "wishlist.book",
                            foreignField: "_id",
                            as: "wishlist.book",
                        },
                    },
                    {
                        $unwind: "$wishlist.book",
                    },
                    {
                        $group: {
                            _id: null,
                            wishlist: {
                                $push: "$wishlist",
                            },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            wishlist: 1,
                        },
                    },
                ]);
                const result = yield wishlist.toArray();
                res.json(result[0]);
            }));
            app.delete("/users/:email/wishlist/:bookId", (req, res) => __awaiter(this, void 0, void 0, function* () {
                const { email, bookId } = req.params;
                const wishlist = wishlistCollection.aggregate([
                    {
                        $match: {
                            user: email,
                        },
                    },
                    {
                        $project: {
                            wishlist: {
                                $filter: {
                                    input: "$wishlist",
                                    as: "list",
                                    cond: { $ne: ["$$list.book", new mongodb_1.ObjectId(bookId)] },
                                },
                            },
                        },
                    },
                    {
                        $addFields: {
                            wishlist: "$wishlist",
                        },
                    },
                    {
                        $merge: "wishlist",
                    },
                ]);
                const result = yield wishlist.toArray();
                res.json(result);
            }));
        }
        finally {
        }
    });
}
run().catch((error) => {
    console.error("Failed to connect database!", error);
});
app.get("/", (req, res) => {
    res.send("Welcome to Book Catalog!");
});
app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`);
});
