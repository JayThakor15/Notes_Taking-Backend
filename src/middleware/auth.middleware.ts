import type { Request, NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

// Extend the Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token required",
      });
    }

    const token = authHeader.split(" ")[1];;

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        message: "JWT secret is not defined in environment variables",
      });
    }

    if (!token || typeof token !== "string") {
      return res.status(401).json({
        success: false,
        message: "Invalid token format",
      });
    }

    // Safely cast the decoded token
    const decoded = jwt.verify(token, jwtSecret) as unknown as {
      userId: string;
    };

    // Find user
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user; // Attach user to request
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};
export default verifyToken;
