import { Request, Response } from "express";
import crypto from "crypto";
import path from "path";
import db from "../lib/redis";
import { passwordModel } from "../model";
interface UserData {
    id: string;
    appname: string;
    password: string;
}


interface GenerateBody {
    length: string;
    appName: string;
}

export const getIndex = async (req: Request, res: Response) => {
    try {
        const userId = (req.session as any).user._id;
        const userData = await db.get(`userId:${userId}`);

        if (userData) {
            const parsedData: UserData[] = JSON.parse(userData);
            
            parsedData.forEach((current: any) => {
                const [encrypted, IV, authTag] = current.password.split(":");
                const key = Buffer.from(process.env.ENCRYPTION_KEY!, "base64");
                const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(IV, "base64"));
                decipher.setAuthTag(Buffer.from(authTag, "base64"));
                const decrypted = Buffer.concat([
                    decipher.update(Buffer.from(encrypted, "base64")),
                    decipher.final()
                ]);
                current.password = decrypted.toString("utf8");
            });

            const flashMsg = req.flash("error");
            return res.render("index", {
                data: parsedData,
                recent: parsedData[0],
                username: (req.session as any).user.username,
                msg: flashMsg.length > 0 ? flashMsg : ""
            });
        }

        const passwords = await passwordModel.find({ id: userId }).sort({ _id: -1 });
        if (passwords.length === 0) {
            return res.render("index", {
                data: [],
                recent: { appname: "AppName", password: "Password" },
                username: (req.session as any).user.username,
                msg: ""
            });
        }

        await db.set(`userId:${userId}`, JSON.stringify(passwords), { EX: 600 });

        passwords.forEach((current: any) => {
            const [encrypted, IV, authTag] = current.password.split(":");
            const key = Buffer.from(process.env.ENCRYPTION_KEY!, "base64");
            const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(IV, "base64"));
            decipher.setAuthTag(Buffer.from(authTag, "base64"));
            const decrypted = Buffer.concat([
                decipher.update(Buffer.from(encrypted, "base64")),
                decipher.final()
            ]);
            current.password = decrypted.toString("utf8");
        });

        return res.render("index", {
            data: passwords,
            recent: passwords[0],
            username: (req.session as any).user.username,
            msg: ""
        });
    } catch (err) {
        console.error("Error fetching user data:", err);
        return res.status(500).send("Internal Server Error");
    }
};

export const getVault = (req: Request, res: Response) => {
    res.type("html");
    res.sendFile(path.join(__dirname, "../../views/vault.ejs"));
};

export const getVaultData = async (req: Request, res: Response) => {
    const userId = (req.session as any).user._id;
    try {
        const page = parseInt(req.query.page as string) || 1;
        const Data = await passwordModel.find({ id: userId })
            .sort({ _id: -1 })
            .skip((page - 1) * 10)
            .limit(10)
            .select("-id -__v -password");
        
        const total = await passwordModel.countDocuments({ id: userId });
        if (Data.length === 0) return res.json({ data: [] });
        
        return res.json({ data: Data, username: (req.session as any).user.username, total: total });
    } catch (err) {
        return res.status(500).json({ msg: "internal server error" });
    }
};

export const searchPasswords = async (req: Request, res: Response) => {
    const userId = (req.session as any).user._id;
    const query = req.query.query as string;
    try {
        const passwords = await passwordModel.find({ id: userId, appname: { $regex: query, $options: "i" } })
            .select("-id -__v -password");
        if (passwords.length === 0) return res.json({ data: [] });

        return res.json({ data: passwords, username: (req.session as any).user.username, total: passwords.length });
    } catch (err) {
        return res.status(500).json({ msg: "internal server error" });
    }
};

export const showPassword = async (req: Request, res: Response) => {
    try {
        const userId = (req.session as any).user._id;
        const passwordId = req.params.id;
        if (!userId) {
            return res.redirect("/login");
        }
        const passwordData = await passwordModel.findOne({ _id: passwordId, id: userId });
        if (!passwordData || !passwordId || userId !== passwordData.id) {
            res.clearCookie("connect-ssid");
            req.session.destroy((err) => {
                if (err) console.log(`error while destroying session ${err}`);
            });
            return res.redirect("/login");
        }
        
        const [encrypted, IV, authTag] = passwordData.password!.split(":") as [string, string, string];
        const key = Buffer.from(process.env.ENCRYPTION_KEY!, "base64");
        const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(IV, "base64"));
        decipher.setAuthTag(Buffer.from(authTag, "base64"));
        const decrypted = Buffer.concat([
            decipher.update(Buffer.from(encrypted, "base64")),
            decipher.final()
        ]);

        return res.json({ password: decrypted.toString("utf8") });
    } catch (error) {
        return res.status(500).json({ msg: "internal server error" });
    }
};

export const generatePassword = async (req: Request<{}, {}, GenerateBody>, res: Response) => {
    const { length, appName } = req.body;
    const userId = (req.session as any).user._id;
    const parsedLength = parseInt(length);

    if (!length || parsedLength <= 0 || length.length > 2) {
        req.flash("error", "App Name is required");
        return res.status(400).redirect("/");
    }
    const regex = /^[A-Za-z0-9 _-]{3,20}$/;
    if (!appName || !regex.test(appName)) {
        req.flash("error", "invalid App Name");
        return res.redirect("/");
    }

    const chars = 'abcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*":;[]{}`~()_+=ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let randArray = new Uint32Array(parsedLength);
    crypto.getRandomValues(randArray);
    let password = "";
    for (let i = 0; i < parsedLength; i++) {
        password += chars[randArray[i]! % chars.length];
    }

    const key = Buffer.from(process.env.ENCRYPTION_KEY!, "base64");
    const IV = crypto.randomBytes(12);
    const cypher = crypto.createCipheriv("aes-256-gcm", key, IV);
    const encrypted = Buffer.concat([
        cypher.update(password, "utf8"),
        cypher.final()
    ]);
    const encryptedData = `${encrypted.toString("base64")}:${IV.toString("base64")}:${cypher.getAuthTag().toString("base64")}`;

    await passwordModel.insertOne({
        id: userId,
        appname: appName,
        password: encryptedData
    });

    await db.del(`userId:${userId}`);
    return res.status(302).redirect("/");
};

export const deletePassword = async (req: Request<{appName:string}>, res: Response) => {
    try {
        const appName = req.params.appName;
        const userId = (req.session as any).user._id;
        await db.del(`userId:${userId}`);

        const find = await passwordModel.findOne({ appname: appName });
        if (!find) {
            return res.status(404).send("password not found");
        }
        await passwordModel.deleteOne({ appname: appName, id: userId });
        return res.status(200).json({ url: "/" });
    } catch (err) {
        return res.status(500).send("Internal Server Error");
    }
};

export const clearPasswords = async (req: Request, res: Response) => {
    try {
        const userId = (req.session as any).user._id;
        const passwords = await passwordModel.find({ id: userId });
        if (passwords.length === 0) return res.status(400).json({ msg: "no data to clear" });
        
        await passwordModel.deleteMany({ id: userId });
        await db.del(`userId:${userId}`);
        return res.json({ url: "/" });
    } catch (err) {
        return res.status(500).send("internal servr error");
    }
};
