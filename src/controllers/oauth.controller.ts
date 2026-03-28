import { Request, Response } from "express";

interface IUser {
    _id: String;
    email: String;
    username: String;
    verified: boolean;
}

export const googleAuthCallback = (req: Request, res: Response) => {
    if (req.user) {
        const user = req.user as IUser;
        (req.session as any).user = {
            _id: user._id,
            email: user.email,
            username: user.username,
            verified: true
        };
    } else {
        return res.status(401).send('User not authenticated');
    }
    res.redirect('/');
};
