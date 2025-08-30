import type { Request, Response, NextFunction } from "express";
import type { RequestHandler } from "express-serve-static-core";
import cloudinary from "../config/cloudinary.js";
import User from "../models/user.model.js";
import { streamToBuffer } from "../utils/streamToBuffer.js";

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

interface FileUploadRequest extends AuthenticatedRequest {
  file: Express.Multer.File;
}

interface CloudinaryUploadResult {
  secure_url: string;
  [key: string]: any;
}

const userController = {
  uploadProfilePicture: async (req: FileUploadRequest, res: Response) => {
    try {
      console.log("Starting profile picture upload...");

      if (!req.file) {
        console.log("No file found in request");
        return res.status(400).json({ message: "No image file provided" });
      }

      console.log("File received:", {
        fieldname: req.file.fieldname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });

      if (!req.user?.id) {
        console.log("No user ID found in request");
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Convert the file buffer to base64
      const buffer = req.file.buffer;
      const base64Image = buffer.toString("base64");

      // Upload to Cloudinary using base64
      console.log("Starting Cloudinary upload...");
      console.log("File type:", req.file.mimetype);
      console.log("Base64 length:", base64Image.length);

      const result = await new Promise<CloudinaryUploadResult>(
        (resolve, reject) => {
          cloudinary.uploader.upload(
            `data:${req.file.mimetype};base64,${base64Image}`,
            {
              folder: "notes-app-profiles",
              timestamp: Math.round(new Date().getTime() / 1000),
              allowed_formats: ["jpg", "jpeg", "png", "gif"],
              transformation: {
                width: 200,
                height: 200,
                crop: "fill",
                gravity: "face",
              },
            },
            (error, result) => {
              if (error) {
                console.error("Cloudinary upload error:", error);
                reject(error);
              } else {
                console.log("Cloudinary upload successful");
                resolve(result as CloudinaryUploadResult);
              }
            }
          );
        }
      ).catch((error) => {
        console.error("Detailed upload error:", error);
        throw error;
      });

      // Update user profile in database
      await User.findByIdAndUpdate(req.user.id, {
        picture: result.secure_url, // Using the existing 'picture' field from the user model
      });

      res.json({
        message: "Profile picture updated successfully",
        profilePicture: result.secure_url,
      });
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      res.status(500).json({
        message: "Error uploading profile picture",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },

  getProfile: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await User.findById(req.user.id).select("-password");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Error fetching profile" });
    }
  },
};

export default userController;
