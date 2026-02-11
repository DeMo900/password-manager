import { Request, Response, NextFunction } from "express";

// Middleware to check if session user id exists
const isAllowed = (req: Request, res: Response, next: NextFunction) => {
  // Check if session exists and has user with _id (as you're using in app.ts)
  if (!req.session || !(req.session as any).user || !(req.session as any).user._id) {
    return res.redirect("/login");
  }
  // If user exists, continue to next middleware/route
  next();
};

export default isAllowed;