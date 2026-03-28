import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import * as helmet from "helmet";
import path from "path";
import session from "express-session";
import flash from "connect-flash";
import { RedisStore } from "connect-redis";
import cookieParser from "cookie-parser";
import db from "./lib/redis";
import passport from "./config/passport";
import router from "./routes";

dotenv.config();

const port = process.env.PORT || 3000;
const app = express();

// Wait for Redis connection or use the client directly
const store = new RedisStore({
    client: db,
    ttl: 3600
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URL!)
    .then(() => {
        console.log("MongoDB connected");
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err);
    });

// Middlewares
app.use(session({
    store,
    secret: process.env.SESSION_SECRET_!,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 15
    }
}));
app.use(flash());
app.use(cookieParser());
app.set("view engine", "ejs");
app.use(helmet.default());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../assets")));
app.use(express.urlencoded({ extended: true }));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/", router);

// Error handling or fallback could go here

app.listen(port, () => {
    console.log(`Server is listening to port ${port}`);
});

export default db;
