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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var redis = require("redis");
var crypto_1 = require("crypto");
var dotenv_1 = require("dotenv");
dotenv_1.default.config();
var port = process.env.PORT;
var app = (0, express_1.default)();
// redis client
var db = redis.createClient({
    url: "redis://127.0.0.1:6379"
});
(function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    switch (_a.label) {
        case 0: return [4 /*yield*/, db.connect()];
        case 1: return [2 /*return*/, _a.sent()];
    }
}); }); })();
db.on('error', function (err) {
    console.log("Redis Client Error ".concat(err));
});
// middlewares
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
//functions
var deletePassword = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, db.del(req.body.name)];
            case 1:
                _a.sent();
                return [2 /*return*/, res.status(200).send("password  deleted")];
        }
    });
}); };
// routes
app.get("/", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var arr, key, i, value;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                arr = [];
                return [4 /*yield*/, db.keys("*")];
            case 1:
                key = _b.sent();
                console.log(key);
                i = 0;
                _b.label = 2;
            case 2:
                if (!(i < key.length)) return [3 /*break*/, 5];
                return [4 /*yield*/, db.get(key[i])];
            case 3:
                value = _b.sent();
                arr.push((_a = {}, _a[key[i]] = value, _a));
                _b.label = 4;
            case 4:
                i++;
                return [3 /*break*/, 2];
            case 5:
                res.send(arr);
                return [2 /*return*/];
        }
    });
}); });
//post
app.post("/generate", function (req, res) {
    var _a = req.body, length = _a.length, appName = _a.appName;
    length = parseInt(length);
    if (!length || length <= 0) {
        return res.status(400).send("Invalid length");
    }
    if (!appName) {
        return res.status(400).send("App name is required");
    }
    //delete existing password
    app.delete("/delete", deletePassword);
    //generate password
    var password = crypto_1.default.randomBytes(Math.ceil(length / 2)).toString("hex").slice(0, length);
    db.set(appName, password);
    return res.status(200).send("password set".concat(appName, ":").concat(password));
});
//listening 
app.listen(port, function (err) {
    if (err) {
        console.error("Error starting the server:", err);
        process.exit(1);
    }
    console.log("server is listening to port ".concat(port, " "));
});
