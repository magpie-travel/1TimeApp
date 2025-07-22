import {
  users,
  memories,
  memoryPrompts,
  memoryShares,
  type User,
  type InsertUser,
  type Memory,
  type InsertMemory,
  type MemoryPrompt,
  type InsertMemoryPrompt,
  type MemoryShare,
  type InsertMemoryShare,
} from "@shared/schema";
import { eq, desc, and, or, ilike, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;

  // Memory operations
  getMemory(id: string): Promise<Memory | undefined>;
  getMemoriesByUser(
    userId: string,
    limit?: number,
    offset?: number,
  ): Promise<Memory[]>;
  createMemory(memory: InsertMemory): Promise<Memory>;
  updateMemory(
    id: string,
    memory: Partial<InsertMemory>,
  ): Promise<Memory | undefined>;
  deleteMemory(id: string): Promise<boolean>;

  // Memory filtering
  getMemoriesByEmotion(userId: string, emotion: string): Promise<Memory[]>;
  getMemoriesByLocation(userId: string, location: string): Promise<Memory[]>;
  getMemoriesByPeople(userId: string, people: string[]): Promise<Memory[]>;
  getMemoriesByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Memory[]>;
  searchMemories(userId: string, query: string): Promise<Memory[]>;

  // Memory prompts
  getMemoryPrompts(category?: string): Promise<MemoryPrompt[]>;
  getRandomPrompt(): Promise<MemoryPrompt | undefined>;
  createMemoryPrompt(prompt: InsertMemoryPrompt): Promise<MemoryPrompt>;

  // Sharing
  getMemoryByShareToken(token: string): Promise<Memory | undefined>;
  generateShareToken(memoryId: string): Promise<string>;

  // Memory sharing with specific users
  shareMemoryWithUser(
    memoryId: string,
    email: string,
    sharedByUserId: string,
    permission?: string,
  ): Promise<MemoryShare>;
  getMemoryShares(memoryId: string): Promise<MemoryShare[]>;
  getSharedMemoriesForUser(email: string): Promise<Memory[]>;
  revokeMemoryShare(shareId: string): Promise<boolean>;
  updateMemoryVisibility(
    memoryId: string,
    visibility: string,
  ): Promise<Memory | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private memories: Map<string, Memory> = new Map();
  private memoryPrompts: Map<number, MemoryPrompt> = new Map();
  private shareTokens: Map<string, string> = new Map(); // token -> memoryId
  private memoryShares: Map<string, MemoryShare> = new Map(); // shareId -> MemoryShare

  constructor() {
    // Initialize with some default prompts
    this.initializePrompts();
  }

  private initializePrompts() {
    const defaultPrompts = [
      {
        category: "childhood",
        prompt: "Describe a birthday that stands out from your childhood",
        isActive: true,
      },
      {
        category: "childhood",
        prompt: "What was your favorite hiding spot as a child?",
        isActive: true,
      },
      {
        category: "childhood",
        prompt: "Tell me about your first day of school",
        isActive: true,
      },
      {
        category: "daily",
        prompt: "Describe a perfect ordinary day in your life",
        isActive: true,
      },
      {
        category: "daily",
        prompt: "Tell me about a meal that was more than just food",
        isActive: true,
      },
      {
        category: "daily",
        prompt: "What's a small victory you had this week?",
        isActive: true,
      },
      {
        category: "relationships",
        prompt: "Write about a conversation that changed your perspective",
        isActive: true,
      },
      {
        category: "relationships",
        prompt: "Describe a moment when you felt truly understood by someone",
        isActive: true,
      },
      {
        category: "relationships",
        prompt: "Tell me about a time you made a new friend",
        isActive: true,
      },
      {
        category: "travel",
        prompt: "Describe a place that took your breath away",
        isActive: true,
      },
      {
        category: "travel",
        prompt: "Tell me about getting lost and finding something unexpected",
        isActive: true,
      },
      {
        category: "achievements",
        prompt: "Write about a goal you achieved that seemed impossible",
        isActive: true,
      },
      {
        category: "achievements",
        prompt: "Describe a moment when you overcame a fear",
        isActive: true,
      },
    ];

    defaultPrompts.forEach((prompt, index) => {
      this.memoryPrompts.set(index + 1, { id: index + 1, ...prompt });
    });
  }

  private generateId(): string {
    return crypto.randomUUID();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.generateId();
    const newUser: User = {
      id,
      email: user.email,
      password: user.password || null,
      name: user.name || null,
      avatarUrl: user.avatarUrl || null,
      provider: user.provider || "email",
      createdAt: new Date(),
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(
    id: string,
    user: Partial<InsertUser>,
  ): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;

    const updatedUser = { ...existingUser, ...user };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getMemory(id: string): Promise<Memory | undefined> {
    return this.memories.get(id);
  }

  async getMemoriesByUser(
    userId: string,
    limit = 50,
    offset = 0,
  ): Promise<Memory[]> {
    return Array.from(this.memories.values())
      .filter((memory) => memory.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(offset, offset + limit);
  }

  async createMemory(memory: InsertMemory): Promise<Memory> {
    const id = this.generateId();
    const now = new Date();
    const newMemory: Memory = {
      id,
      userId: memory.userId,
      type: memory.type,
      content: memory.content,
      transcript: memory.transcript || null,
      audioUrl: memory.audioUrl || null,
      audioDuration: memory.audioDuration || null,
      people: memory.people || null,
      location: memory.location || null,
      emotion: memory.emotion || null,
      date: memory.date,
      prompt: memory.prompt || null,
      isPublic: memory.isPublic || false,
      shareToken: memory.shareToken || null,
      attachments: memory.attachments || null,
      imageUrl: memory.imageUrl || null,
      videoUrl: memory.videoUrl || null,
      title: memory.title || null,
      visibility: memory.visibility || "private",
      createdAt: now,
      updatedAt: now,
    };
    this.memories.set(id, newMemory);
    return newMemory;
  }

  async updateMemory(
    id: string,
    memory: Partial<InsertMemory>,
  ): Promise<Memory | undefined> {
    const existingMemory = this.memories.get(id);
    if (!existingMemory) return undefined;

    const updatedMemory = {
      ...existingMemory,
      ...memory,
      updatedAt: new Date(),
    };
    this.memories.set(id, updatedMemory);
    return updatedMemory;
  }

  async deleteMemory(id: string): Promise<boolean> {
    return this.memories.delete(id);
  }

  async getMemoriesByEmotion(
    userId: string,
    emotion: string,
  ): Promise<Memory[]> {
    return Array.from(this.memories.values())
      .filter(
        (memory) => memory.userId === userId && memory.emotion === emotion,
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getMemoriesByLocation(
    userId: string,
    location: string,
  ): Promise<Memory[]> {
    return Array.from(this.memories.values())
      .filter(
        (memory) =>
          memory.userId === userId &&
          memory.location?.toLowerCase().includes(location.toLowerCase()),
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getMemoriesByPeople(
    userId: string,
    people: string[],
  ): Promise<Memory[]> {
    return Array.from(this.memories.values())
      .filter(
        (memory) =>
          memory.userId === userId &&
          memory.people?.some((person) =>
            people.some((p) => person.toLowerCase().includes(p.toLowerCase())),
          ),
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getMemoriesByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Memory[]> {
    return Array.from(this.memories.values())
      .filter((memory) => {
        const memoryDate = new Date(memory.date);
        return (
          memory.userId === userId &&
          memoryDate >= startDate &&
          memoryDate <= endDate
        );
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async searchMemories(userId: string, query: string): Promise<Memory[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.memories.values())
      .filter(
        (memory) =>
          memory.userId === userId &&
          (memory.content.toLowerCase().includes(lowerQuery) ||
            memory.transcript?.toLowerCase().includes(lowerQuery) ||
            memory.location?.toLowerCase().includes(lowerQuery) ||
            memory.people?.some((person) =>
              person.toLowerCase().includes(lowerQuery),
            )),
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getMemoryPrompts(category?: string): Promise<MemoryPrompt[]> {
    return Array.from(this.memoryPrompts.values()).filter(
      (prompt) =>
        prompt.isActive && (!category || prompt.category === category),
    );
  }

  async getRandomPrompt(): Promise<MemoryPrompt | undefined> {
    const activePrompts = Array.from(this.memoryPrompts.values()).filter(
      (p) => p.isActive,
    );
    if (activePrompts.length === 0) return undefined;

    const randomIndex = Math.floor(Math.random() * activePrompts.length);
    return activePrompts[randomIndex];
  }

  async createMemoryPrompt(prompt: InsertMemoryPrompt): Promise<MemoryPrompt> {
    const id = Math.max(...Array.from(this.memoryPrompts.keys()), 0) + 1;
    const newPrompt: MemoryPrompt = {
      id,
      category: prompt.category,
      prompt: prompt.prompt,
      isActive: prompt.isActive !== undefined ? prompt.isActive : true,
    };
    this.memoryPrompts.set(id, newPrompt);
    return newPrompt;
  }

  async getMemoryByShareToken(token: string): Promise<Memory | undefined> {
    const memoryId = this.shareTokens.get(token);
    return memoryId ? this.memories.get(memoryId) : undefined;
  }

  async generateShareToken(memoryId: string): Promise<string> {
    const token = crypto.randomUUID();
    this.shareTokens.set(token, memoryId);

    // Also update the memory with the share token
    const memory = this.memories.get(memoryId);
    if (memory) {
      memory.shareToken = token;
      this.memories.set(memoryId, memory);
    }

    return token;
  }

  async shareMemoryWithUser(
    memoryId: string,
    email: string,
    sharedByUserId: string,
    permission: string = "view",
  ): Promise<MemoryShare> {
    const shareId = crypto.randomUUID();
    const sharedWithUser = Array.from(this.users.values()).find(
      (u) => u.email === email,
    );

    const share: MemoryShare = {
      id: shareId,
      memoryId,
      sharedWithEmail: email,
      sharedWithUserId: sharedWithUser?.id || null,
      sharedByUserId,
      permission,
      createdAt: new Date(),
    };

    this.memoryShares.set(shareId, share);
    return share;
  }

  async getMemoryShares(memoryId: string): Promise<MemoryShare[]> {
    return Array.from(this.memoryShares.values()).filter(
      (share) => share.memoryId === memoryId,
    );
  }

  async getSharedMemoriesForUser(email: string): Promise<Memory[]> {
    const userShares = Array.from(this.memoryShares.values()).filter(
      (share) => share.sharedWithEmail === email,
    );
    const sharedMemories: Memory[] = [];

    for (const share of userShares) {
      const memory = this.memories.get(share.memoryId);
      if (memory) {
        sharedMemories.push(memory);
      }
    }

    return sharedMemories;
  }

  async revokeMemoryShare(shareId: string): Promise<boolean> {
    return this.memoryShares.delete(shareId);
  }

  async updateMemoryVisibility(
    memoryId: string,
    visibility: string,
  ): Promise<Memory | undefined> {
    const memory = this.memories.get(memoryId);
    if (memory) {
      const updatedMemory = { ...memory, visibility };
      this.memories.set(memoryId, updatedMemory);
      return updatedMemory;
    }
    return undefined;
  }
}

// Using in-memory storage for now (database connection issues)
// Switch to DatabaseStorage when database is ready
export const storage = new MemStorage();
