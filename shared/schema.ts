import { pgTable, text, serial, integer, boolean, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Firebase UID is a string
  email: text("email").notNull().unique(),
  password: text("password"),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  provider: text("provider").notNull().default("google"), // email, google, apple
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const memories = pgTable("memories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // text, audio, mixed
  title: text("title"), // optional title for the memory
  content: text("content").notNull(),
  transcript: text("transcript"), // for audio memories
  audioUrl: text("audio_url"), // URL to stored audio file
  audioDuration: integer("audio_duration"), // in seconds
  imageUrl: text("image_url"), // URL to stored image file
  videoUrl: text("video_url"), // URL to stored video file
  attachments: text("attachments").array(), // array of attachment URLs
  people: text("people").array(), // array of people mentioned
  location: text("location"),
  emotion: text("emotion"),
  date: timestamp("date").notNull(),
  prompt: text("prompt"), // if created from a prompt
  isPublic: boolean("is_public").default(false),
  shareToken: text("share_token"), // for sharing
  visibility: text("visibility").notNull().default("private"), // private, shared, public
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// New table for memory sharing with specific users
export const memoryShares = pgTable("memory_shares", {
  id: uuid("id").primaryKey().defaultRandom(),
  memoryId: uuid("memory_id").notNull().references(() => memories.id, { onDelete: "cascade" }),
  sharedWithEmail: text("shared_with_email").notNull(),
  sharedWithUserId: text("shared_with_user_id").references(() => users.id, { onDelete: "cascade" }),
  sharedByUserId: text("shared_by_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  permission: text("permission").notNull().default("view"), // view, edit
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const memoryPrompts = pgTable("memory_prompts", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  prompt: text("prompt").notNull(),
  isActive: boolean("is_active").default(true),
});

export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
});

export const insertMemorySchema = createInsertSchema(memories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMemoryPromptSchema = createInsertSchema(memoryPrompts).omit({
  id: true,
});

export const insertMemoryShareSchema = createInsertSchema(memoryShares).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertMemory = z.infer<typeof insertMemorySchema>;
export type Memory = typeof memories.$inferSelect;
export type InsertMemoryPrompt = z.infer<typeof insertMemoryPromptSchema>;
export type MemoryPrompt = typeof memoryPrompts.$inferSelect;
export type InsertMemoryShare = z.infer<typeof insertMemoryShareSchema>;
export type MemoryShare = typeof memoryShares.$inferSelect;
