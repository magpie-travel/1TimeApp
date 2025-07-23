// Database storage implementation
import { eq, desc, like, and, inArray, between, sql } from "drizzle-orm";
import { db } from "./db.js";
import { users, memories, memoryPrompts, memoryShares } from "@shared/schema";
import type { IStorage } from "./storage.js";
import type { User, InsertUser, Memory, InsertMemory, MemoryPrompt, InsertMemoryPrompt, MemoryShare, InsertMemoryShare } from "@shared/schema";

export class DatabaseStorage implements IStorage {
  
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return result[0];
  }

  // Memory operations
  async getMemory(id: string): Promise<Memory | undefined> {
    const result = await db.select().from(memories).where(eq(memories.id, id)).limit(1);
    return result[0];
  }

  async getMemoriesByUser(userId: string, limit = 50, offset = 0): Promise<Memory[]> {
    const result = await db
      .select()
      .from(memories)
      .where(eq(memories.userId, userId))
      .orderBy(desc(memories.date))
      .limit(limit)
      .offset(offset);
    return result;
  }

  async createMemory(memory: InsertMemory): Promise<Memory> {
    const result = await db.insert(memories).values({
      ...memory,
      updatedAt: new Date(),
    }).returning();
    return result[0];
  }

  async updateMemory(id: string, memory: Partial<InsertMemory>): Promise<Memory | undefined> {
    const result = await db.update(memories).set({
      ...memory,
      updatedAt: new Date(),
    }).where(eq(memories.id, id)).returning();
    return result[0];
  }

  async deleteMemory(id: string): Promise<boolean> {
    try {
      await db.delete(memories).where(eq(memories.id, id));
      return true;
    } catch (error) {
      return false;
    }
  }

  // Memory filtering
  async getMemoriesByEmotion(userId: string, emotion: string): Promise<Memory[]> {
    const result = await db
      .select()
      .from(memories)
      .where(and(
        eq(memories.userId, userId),
        eq(memories.emotion, emotion)
      ))
      .orderBy(desc(memories.date));
    return result;
  }

  async getMemoriesByLocation(userId: string, location: string): Promise<Memory[]> {
    const result = await db
      .select()
      .from(memories)
      .where(and(
        eq(memories.userId, userId),
        like(memories.location, `%${location}%`)
      ))
      .orderBy(desc(memories.date));
    return result;
  }

  async getMemoriesByPeople(userId: string, people: string[]): Promise<Memory[]> {
    const result = await db
      .select()
      .from(memories)
      .where(and(
        eq(memories.userId, userId),
        sql`${memories.people} && ${people}` // PostgreSQL array overlap operator
      ))
      .orderBy(desc(memories.date));
    return result;
  }

  async getMemoriesByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Memory[]> {
    const result = await db
      .select()
      .from(memories)
      .where(and(
        eq(memories.userId, userId),
        between(memories.date, startDate, endDate)
      ))
      .orderBy(desc(memories.date));
    return result;
  }

  async searchMemories(userId: string, query: string): Promise<Memory[]> {
    const result = await db
      .select()
      .from(memories)
      .where(and(
        eq(memories.userId, userId),
        sql`(
          ${memories.content} ILIKE ${`%${query}%`} OR
          ${memories.transcript} ILIKE ${`%${query}%`} OR
          ${memories.location} ILIKE ${`%${query}%`} OR
          ${memories.emotion} ILIKE ${`%${query}%`}
        )`
      ))
      .orderBy(desc(memories.date));
    return result;
  }

  // Memory prompts
  async getMemoryPrompts(category?: string): Promise<MemoryPrompt[]> {
    if (category) {
      const result = await db.select().from(memoryPrompts).where(and(
        eq(memoryPrompts.isActive, true),
        eq(memoryPrompts.category, category)
      ));
      return result;
    }
    
    const result = await db.select().from(memoryPrompts).where(eq(memoryPrompts.isActive, true));
    return result;
  }

  async getRandomPrompt(): Promise<MemoryPrompt | undefined> {
    const result = await db
      .select()
      .from(memoryPrompts)
      .where(eq(memoryPrompts.isActive, true))
      .orderBy(sql`RANDOM()`)
      .limit(1);
    return result[0];
  }

  async createMemoryPrompt(prompt: InsertMemoryPrompt): Promise<MemoryPrompt> {
    const result = await db.insert(memoryPrompts).values(prompt).returning();
    return result[0];
  }

  // Sharing
  async getMemoryByShareToken(token: string): Promise<Memory | undefined> {
    const result = await db
      .select()
      .from(memories)
      .where(and(
        eq(memories.shareToken, token),
        eq(memories.isPublic, true)
      ))
      .limit(1);
    return result[0];
  }

  async generateShareToken(memoryId: string): Promise<string> {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    await db.update(memories).set({
      shareToken: token,
      isPublic: true,
      updatedAt: new Date(),
    }).where(eq(memories.id, memoryId));
    
    return token;
  }

  // Memory sharing with specific users
  async shareMemoryWithUser(
    memoryId: string,
    email: string,
    sharedByUserId: string,
    permission = 'view'
  ): Promise<MemoryShare> {
    const shareData = {
      id: Math.random().toString(36).substring(2, 15),
      memoryId,
      sharedWithEmail: email,
      sharedByUserId,
      permission,
      createdAt: new Date(),
    };

    const result = await db.insert(memoryShares).values(shareData).returning();
    return result[0];
  }

  async getMemoryShares(memoryId: string): Promise<MemoryShare[]> {
    const result = await db
      .select()
      .from(memoryShares)
      .where(eq(memoryShares.memoryId, memoryId));
    return result;
  }

  async getSharedMemoriesForUser(email: string): Promise<Memory[]> {
    const result = await db
      .select({
        id: memories.id,
        userId: memories.userId,
        type: memories.type,
        content: memories.content,
        transcript: memories.transcript,
        audioUrl: memories.audioUrl,
        audioDuration: memories.audioDuration,
        people: memories.people,
        location: memories.location,
        emotion: memories.emotion,
        date: memories.date,
        prompt: memories.prompt,
        title: memories.title,
        imageUrl: memories.imageUrl,
        videoUrl: memories.videoUrl,
        visibility: memories.visibility,
        isPublic: memories.isPublic,
        shareToken: memories.shareToken,
        attachments: memories.attachments,
        createdAt: memories.createdAt,
        updatedAt: memories.updatedAt,
      })
      .from(memories)
      .innerJoin(memoryShares, eq(memories.id, memoryShares.memoryId))
      .where(eq(memoryShares.sharedWithEmail, email))
      .orderBy(desc(memories.date));
    return result;
  }

  async revokeMemoryShare(shareId: string): Promise<boolean> {
    try {
      await db.delete(memoryShares).where(eq(memoryShares.id, shareId));
      return true;
    } catch (error) {
      return false;
    }
  }

  async updateMemoryVisibility(
    memoryId: string,
    visibility: string
  ): Promise<Memory | undefined> {
    const result = await db
      .update(memories)
      .set({ 
        visibility, 
        updatedAt: new Date() 
      })
      .where(eq(memories.id, memoryId))
      .returning();
    return result[0];
  }
}