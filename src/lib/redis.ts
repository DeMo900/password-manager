import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const db = createClient();

db.on("error", (err) => console.error("Redis Client Error", err));

// Connect to Redis
 db.connect();

export default db;
