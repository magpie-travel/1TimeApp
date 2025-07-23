import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertMemorySchema } from "@shared/schema";
import {
  transcribeAudio,
  analyzeSentiment,
  semanticSearch,
  intelligentQueryExpansion,
} from "./services/openai";
import {
  getPromptsForCategory,
  getRandomPrompt,
  generateAIPrompt,
  promptCategories,
} from "./services/prompts";
import multer from "multer";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for images and videos
});

// File upload helper function
function generateFileUrl(buffer: Buffer, filename: string): string {
  // In a real app, you'd upload to cloud storage (S3, Cloudinary, etc.)
  // For now, we'll create a base64 data URL
  const mimeType = filename.endsWith(".mp4")
    ? "video/mp4"
    : filename.endsWith(".wav")
      ? "audio/wav"
      : filename.endsWith(".webm")
        ? "audio/webm"
        : filename.endsWith(".jpg") || filename.endsWith(".jpeg")
          ? "image/jpeg"
          : filename.endsWith(".png")
            ? "image/png"
            : filename.endsWith(".gif")
              ? "image/gif"
              : "application/octet-stream";

  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for deployment monitoring
  app.get("/api/health", async (req, res) => {
    try {
      // Basic health check
      const healthStatus = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        environment: process.env.NODE_ENV || "development",
      };

      res.json(healthStatus);
    } catch (error) {
      res.status(500).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Firebase Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { id, email, name, avatarUrl } = req.body;

      if (!id || !email) {
        return res.status(400).json({ message: "ID and email are required" });
      }

      // Check if user already exists
      let user = await storage.getUser(id);

      if (user) {
        // Update existing user
        user = await storage.updateUser(id, {
          email,
          name: name || email.split("@")[0],
          avatarUrl:
            avatarUrl ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email)}&background=random`,
        });
      } else {
        // Create new user
        user = await storage.createUser({
          id,
          email,
          name: name || email.split("@")[0],
          avatarUrl:
            avatarUrl ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email)}&background=random`,
        });
      }

      res.json({ user });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);

      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.json({ user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Memory routes
  app.get("/api/memories", async (req, res) => {
    try {
      const {
        userId,
        limit = 50,
        offset = 0,
        emotion,
        location,
        people,
        search,
      } = req.query;

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      let memories;

      if (search) {
        memories = await storage.searchMemories(
          userId as string,
          search as string,
        );
      } else if (emotion) {
        memories = await storage.getMemoriesByEmotion(
          userId as string,
          emotion as string,
        );
      } else if (location) {
        memories = await storage.getMemoriesByLocation(
          userId as string,
          location as string,
        );
      } else if (people) {
        const peopleArray = Array.isArray(people) ? people : [people];
        memories = await storage.getMemoriesByPeople(
          userId as string,
          peopleArray as string[],
        );
      } else {
        memories = await storage.getMemoriesByUser(
          userId as string,
          Number(limit),
          Number(offset),
        );
      }

      res.json(memories);
    } catch (error) {
      console.error("Error fetching memories:", error);
      res.status(500).json({ message: "Failed to fetch memories" });
    }
  });

  // Semantic search endpoint
  app.post("/api/memories/semantic-search", async (req, res) => {
    try {
      const { query, userId } = req.body;

      if (!query || !userId) {
        return res
          .status(400)
          .json({ message: "Query and user ID are required" });
      }

      // Get all user memories first
      const allMemories = await storage.getMemoriesByUser(userId, 100, 0);

      if (allMemories.length === 0) {
        return res.json({
          results: [],
          queryExpansion: null,
          message: "No memories found for semantic search",
        });
      }

      // Perform intelligent query expansion
      const queryExpansion = await intelligentQueryExpansion(query);

      // Perform semantic search
      const searchResults = await semanticSearch(query, allMemories);

      res.json({
        results: searchResults,
        queryExpansion,
        originalQuery: query,
        message: `Found ${searchResults.length} relevant memories`,
      });
    } catch (error) {
      console.error("Error in semantic search:", error);
      res.status(500).json({ message: "Failed to perform semantic search" });
    }
  });

  app.get("/api/memories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const memory = await storage.getMemory(id);

      if (!memory) {
        return res.status(404).json({ message: "Memory not found" });
      }

      res.json(memory);
    } catch (error) {
      console.error("Error fetching memory:", error);
      res.status(500).json({ message: "Failed to fetch memory" });
    }
  });

  app.post("/api/memories", async (req, res) => {
    try {
      console.log("Received memory data:", req.body);

      // Handle date conversion manually
      const requestData = { ...req.body };
      if (requestData.date && typeof requestData.date === "string") {
        requestData.date = new Date(requestData.date);
      }

      // Handle attachments properly - convert objects to JSON strings
      if (requestData.attachments && Array.isArray(requestData.attachments)) {
        requestData.attachments = requestData.attachments.map((attachment: any) => {
          if (typeof attachment === "object" && attachment !== null) {
            return JSON.stringify(attachment);
          }
          return attachment;
        });
      }

      const memoryData = insertMemorySchema.parse(requestData);
      console.log("Parsed memory data:", memoryData);

      // Analyze sentiment if content is provided
      if (memoryData.content && !memoryData.emotion) {
        try {
          const sentiment = await analyzeSentiment(memoryData.content);
          memoryData.emotion = sentiment.emotion;
        } catch (error) {
          console.error("Error analyzing sentiment:", error);
        }
      }

      const memory = await storage.createMemory(memoryData);
      res.json(memory);
    } catch (error) {
      console.error("Error creating memory:", error);
      res.status(400).json({
        message: "Invalid memory data",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.put("/api/memories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const memory = await storage.updateMemory(id, updateData);

      if (!memory) {
        return res.status(404).json({ message: "Memory not found" });
      }

      res.json(memory);
    } catch (error) {
      console.error("Error updating memory:", error);
      res.status(500).json({ message: "Failed to update memory" });
    }
  });

  app.delete("/api/memories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteMemory(id);

      if (!success) {
        return res.status(404).json({ message: "Memory not found" });
      }

      res.json({ message: "Memory deleted successfully" });
    } catch (error) {
      console.error("Error deleting memory:", error);
      res.status(500).json({ message: "Failed to delete memory" });
    }
  });

  // Audio transcription route
  app.post("/api/transcribe", upload.single("audio"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No audio file provided" });
      }

      const transcription = await transcribeAudio(req.file.buffer);
      res.json(transcription);
    } catch (error) {
      console.error("Error transcribing audio:", error);
      res.status(500).json({ message: "Failed to transcribe audio" });
    }
  });

  // Audio upload route
  app.post("/api/upload-audio", upload.single("audio"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No audio file provided" });
      }

      const audioUrl = generateFileUrl(req.file.buffer, req.file.originalname);
      res.json({ audioUrl });
    } catch (error) {
      console.error("Error uploading audio:", error);
      res.status(500).json({ message: "Failed to upload audio" });
    }
  });

  // File upload routes
  app.post("/api/upload/image", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      // Validate image file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
      if (!validTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ message: "Invalid image file type" });
      }

      const imageUrl = generateFileUrl(req.file.buffer, req.file.originalname);
      res.json({ imageUrl });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  app.post("/api/upload/video", upload.single("video"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No video file provided" });
      }

      // Validate video file type
      const validTypes = ["video/mp4", "video/quicktime", "video/x-msvideo"];
      if (!validTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ message: "Invalid video file type" });
      }

      const videoUrl = generateFileUrl(req.file.buffer, req.file.originalname);
      res.json({ videoUrl });
    } catch (error) {
      console.error("Error uploading video:", error);
      res.status(500).json({ message: "Failed to upload video" });
    }
  });

  // Multiple file upload route
  app.post("/api/upload/files", upload.array("files", 5), async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files provided" });
      }

      const files = req.files as Express.Multer.File[];
      const uploadedFiles = [];

      for (const file of files) {
        const fileUrl = generateFileUrl(file.buffer, file.originalname);
        uploadedFiles.push({
          url: fileUrl,
          type: file.mimetype,
          name: file.originalname,
          size: file.size,
        });
      }

      res.json({ files: uploadedFiles });
    } catch (error) {
      console.error("Error uploading files:", error);
      res.status(500).json({ message: "Failed to upload files" });
    }
  });

  // Memory prompts routes
  app.get("/api/prompts", async (req, res) => {
    try {
      const { category } = req.query;
      const prompts = await getPromptsForCategory(category as string);
      res.json(prompts);
    } catch (error) {
      console.error("Error fetching prompts:", error);
      res.status(500).json({ message: "Failed to fetch prompts" });
    }
  });

  app.get("/api/prompts/random", async (req, res) => {
    try {
      const prompt = await getRandomPrompt();
      res.json(prompt);
    } catch (error) {
      console.error("Error fetching random prompt:", error);
      res.status(500).json({ message: "Failed to fetch random prompt" });
    }
  });

  app.post("/api/prompts/generate", async (req, res) => {
    try {
      const { category } = req.body;
      const prompt = await generateAIPrompt(category);
      res.json(prompt);
    } catch (error) {
      console.error("Error generating AI prompt:", error);
      res.status(500).json({ message: "Failed to generate prompt" });
    }
  });

  app.get("/api/prompts/categories", async (req, res) => {
    try {
      res.json(promptCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Sharing routes
  app.post("/api/memories/:id/share", async (req, res) => {
    try {
      const { id } = req.params;
      const memory = await storage.getMemory(id);

      if (!memory) {
        return res.status(404).json({ message: "Memory not found" });
      }

      const token = await storage.generateShareToken(id);
      res.json({ token, url: `/shared/${token}` });
    } catch (error) {
      console.error("Error creating share link:", error);
      res.status(500).json({ message: "Failed to create share link" });
    }
  });

  // Share memory with specific user
  app.post("/api/memories/:id/share-with-user", async (req, res) => {
    try {
      const { id } = req.params;
      const { email, permission = "view", sharedByUserId } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      if (!sharedByUserId) {
        return res
          .status(400)
          .json({ message: "Shared by user ID is required" });
      }

      const memory = await storage.getMemory(id);
      if (!memory) {
        return res.status(404).json({ message: "Memory not found" });
      }

      const share = await storage.shareMemoryWithUser(
        id,
        email,
        sharedByUserId,
        permission,
      );
      res.json(share);
    } catch (error) {
      console.error("Error sharing memory:", error);
      res.status(500).json({ message: "Failed to share memory" });
    }
  });

  // Get shares for a memory
  app.get("/api/memories/:id/shares", async (req, res) => {
    try {
      const { id } = req.params;
      const shares = await storage.getMemoryShares(id);
      res.json(shares);
    } catch (error) {
      console.error("Error fetching shares:", error);
      res.status(500).json({ message: "Failed to fetch shares" });
    }
  });

  // Get shared memories for current user
  app.get("/api/shared-memories", async (req, res) => {
    try {
      const { email } = req.query;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const memories = await storage.getSharedMemoriesForUser(email as string);
      res.json(memories);
    } catch (error) {
      console.error("Error fetching shared memories:", error);
      res.status(500).json({ message: "Failed to fetch shared memories" });
    }
  });

  // Revoke memory share
  app.delete("/api/shares/:shareId", async (req, res) => {
    try {
      const { shareId } = req.params;
      const success = await storage.revokeMemoryShare(shareId);

      if (!success) {
        return res.status(404).json({ message: "Share not found" });
      }

      res.json({ message: "Share revoked successfully" });
    } catch (error) {
      console.error("Error revoking share:", error);
      res.status(500).json({ message: "Failed to revoke share" });
    }
  });

  // Update memory visibility
  app.patch("/api/memories/:id/visibility", async (req, res) => {
    try {
      const { id } = req.params;
      const { visibility } = req.body;

      if (
        !visibility ||
        !["private", "shared", "public"].includes(visibility)
      ) {
        return res.status(400).json({ message: "Invalid visibility value" });
      }

      const memory = await storage.updateMemoryVisibility(id, visibility);

      if (!memory) {
        return res.status(404).json({ message: "Memory not found" });
      }

      res.json(memory);
    } catch (error) {
      console.error("Error updating visibility:", error);
      res.status(500).json({ message: "Failed to update visibility" });
    }
  });

  app.get("/api/shared/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const memory = await storage.getMemoryByShareToken(token);

      if (!memory) {
        return res.status(404).json({ message: "Shared memory not found" });
      }

      res.json(memory);
    } catch (error) {
      console.error("Error fetching shared memory:", error);
      res.status(500).json({ message: "Failed to fetch shared memory" });
    }
  });

  // User profile routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const user = await storage.updateUser(id, updateData);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
