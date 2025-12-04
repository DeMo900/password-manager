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
const crypto_1 = __importDefault(require("crypto"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const port = process.env.PORT;
const app = (0, express_1.default)();
// redis client
const db = redis.createClient({
    url: "redis://127.0.0.1:6379"
});
(async () => await db.connect())();
db.on('error', (err) => {
    console.log(`Redis Client Error ${err}`);
});
// middlewares
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
const deletePassword = async (req, res) => {
    await db.del(req.body.appName);
    return res.status(200).send(`password  deleted`);
};
// routes
app.get("/", async (req, res) => {
    let arr = [];
    let key = await db.keys("*");
    console.log(key);
    for (let i = 0; i < key.length; i++) {
        let value = await db.get(key[i]);
        arr.push({ [key[i]]: value });
    }
    res.send(arr);
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
    await db.set(appName, password);
    return res.status(200).send(`password set${appName}:${password}`);
});
//delete existing password
app.delete("/delete", deletePassword);
//listening 
app.listen(port, (err) => {
    if (err) {
        console.error("Error starting the server:", err);
        process.exit(1);
    }
    console.log(`server is listening to port ${port} `);
});
//# sourceMappingURL=app.js.map