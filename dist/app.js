"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const redis = __importStar(require("redis"));
const mongoose_1 = __importDefault(require("mongoose"));
const crypto_1 = __importDefault(require("crypto"));
const dotenv_1 = __importDefault(require("dotenv"));
const helmet = __importStar(require("helmet"));
const auth_1 = __importDefault(require("./auth"));
const oauth_1 = __importDefault(require("./oauth"));
const express_session_1 = __importDefault(require("express-session"));
const connect_redis_1 = require("connect-redis");
dotenv_1.default.config();
const port = process.env.PORT;
const app = (0, express_1.default)();
// redis client
const db = redis.createClient();
(async () => await db.connect())();
db.on('error', async (err) => {
    console.log(`Redis Client Error ${err}`);
});
//mongo client
mongoose_1.default.connect(process.env.MONGO_URL)
    .then(() => {
    console.log("MongoDB connected");
})
    .catch((err) => {
    console.error("MongoDB connection error:", err);
});
// middlewares
app.use((0, express_session_1.default)({
    store: new connect_redis_1.RedisStore({ client: db }),
    secret: process.env.SESSION_SECRET_,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 15
    }
}));
app.set("view engine", "ejs");
app.use(helmet.default());
app.use(express_1.default.json());
app.use(express_1.default.static("assets"));
app.use(express_1.default.urlencoded({ extended: true }));
app.use(oauth_1.default);
app.use(auth_1.default);
const deletePassword = async (req, res) => {
    try {
        let key = await db.get(req.params.appName);
        console.log(req.params.appName);
        if (!key) {
            console.log("not found");
            console.log(key);
            return res.status(404).send("password not found");
        }
        await db.del(req.params.appName);
        console.log("deleted");
        return res.status(200).send("password deleted successfully");
    }
    catch (err) {
        return res.status(500).send("Internal Server Error");
    }
};
// routes
app.get("/", async (req, res) => {
    let arr = [];
    let key = await db.keys("*");
    //console.log(key)
    for (let i = 0; i < key.length; i++) {
        if (key[i].startsWith("sess:")) {
            continue;
        }
        let value = await db.get(key[i]);
        arr.push({ app: key[i], password: value });
    }
    console.log(arr);
    res.render("index", { data: arr });
});
app.post("/generate", async (req, res) => {
    let { length, appName } = req.body;
    let plength = parseInt(length);
    if (!length || plength <= 0) {
        return res.status(400).send("Invalid length");
    }
    if (!appName) {
        return res.status(400).send("App name is required");
    }
    //generate password
    const password = crypto_1.default.randomBytes(Math.ceil(plength / 2)).toString("hex").slice(0, plength);
    await db.set(appName.trim(), password);
    return res.status(302).redirect("/");
});
//delete existing password
app.delete("/delete/:appName", deletePassword);
//listening 
app.listen(port, (err) => {
    if (err) {
        console.error("Error starting the server:", err);
        process.exit(1);
    }
    console.log(`server is listening to port ${port} `);
});
exports.default = db;
//# sourceMappingURL=app.js.map