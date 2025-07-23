// Database initialization
import { db } from "./db";
import { users, memories, memoryPrompts } from "@shared/schema";

export async function initializeDatabase() {
  try {
    console.log("Initializing database...");
    
    // Create tables by running a raw query
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "email" text NOT NULL,
        "password" text,
        "name" text,
        "avatar_url" text,
        "provider" text DEFAULT 'email' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "users_email_unique" UNIQUE("email")
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS "memories" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid NOT NULL,
        "type" text NOT NULL,
        "content" text NOT NULL,
        "transcript" text,
        "audio_url" text,
        "audio_duration" integer,
        "people" text[],
        "location" text,
        "emotion" text,
        "date" timestamp NOT NULL,
        "prompt" text,
        "is_public" boolean DEFAULT false,
        "share_token" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS "memory_prompts" (
        "id" serial PRIMARY KEY NOT NULL,
        "category" text NOT NULL,
        "prompt" text NOT NULL,
        "is_active" boolean DEFAULT true
      );
    `);

    // Add foreign key constraint
    await db.execute(`
      ALTER TABLE "memories" 
      ADD CONSTRAINT IF NOT EXISTS "memories_user_id_users_id_fk" 
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
    `);

    // Initialize default prompts
    await initializeDefaultPrompts();

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}

async function initializeDefaultPrompts() {
  const defaultPrompts = [
    { category: "childhood", prompt: "What was your favorite toy as a child, and why was it special to you?" },
    { category: "childhood", prompt: "Describe a family tradition from your childhood that you still remember fondly." },
    { category: "travel", prompt: "What was the most unexpected thing you discovered during a trip?" },
    { category: "travel", prompt: "Describe a place that felt like home even though you were far from home." },
    { category: "relationships", prompt: "Tell me about a time when someone showed you unexpected kindness." },
    { category: "relationships", prompt: "What's a conversation that changed your perspective on something important?" },
    { category: "achievements", prompt: "What's something you accomplished that you're proud of, no matter how small?" },
    { category: "achievements", prompt: "Describe a moment when you surprised yourself with your own capability." },
    { category: "challenges", prompt: "What's a difficult situation that taught you something valuable about yourself?" },
    { category: "challenges", prompt: "Tell me about a time when you had to be brave." },
    { category: "daily-life", prompt: "What's a simple pleasure in your daily routine that brings you joy?" },
    { category: "daily-life", prompt: "Describe a moment from today that you want to remember." },
    { category: "lessons", prompt: "What's the best advice you've ever received, and who gave it to you?" },
    { category: "lessons", prompt: "What's something you wish you could tell your younger self?" },
    { category: "gratitude", prompt: "What's something you're grateful for that you might take for granted?" },
    { category: "gratitude", prompt: "Tell me about someone who has made a positive impact on your life." },
    { category: "dreams", prompt: "What's a dream or aspiration you have for the future?" },
    { category: "dreams", prompt: "Describe a perfect day in your ideal life." },
    { category: "food", prompt: "What's a meal that brings back strong memories, and why?" },
    { category: "food", prompt: "Tell me about a time when sharing food created a special moment." },
    { category: "nature", prompt: "Describe a time when you felt most connected to nature." },
    { category: "nature", prompt: "What's your favorite season and what memories does it bring back?" },
    { category: "creativity", prompt: "Tell me about something you created that you're proud of." },
    { category: "creativity", prompt: "What's a creative activity that brings you joy?" },
    { category: "work", prompt: "What's the most meaningful work you've ever done?" },
    { category: "work", prompt: "Tell me about a colleague or mentor who influenced your career." },
    { category: "home", prompt: "What makes a place feel like home to you?" },
    { category: "home", prompt: "Describe your favorite room or space and why it's special." },
    { category: "pets", prompt: "Tell me about a pet that was special to you." },
    { category: "pets", prompt: "What's the funniest thing a pet has ever done?" },
    { category: "celebrations", prompt: "What's your most memorable birthday or holiday celebration?" },
    { category: "celebrations", prompt: "Tell me about a celebration where you felt truly happy." },
    { category: "books", prompt: "What's a book that changed your perspective on something?" },
    { category: "books", prompt: "Tell me about a story that has stayed with you over the years." },
    { category: "music", prompt: "What's a song that instantly transports you to a specific memory?" },
    { category: "music", prompt: "Tell me about a musical experience that moved you deeply." },
    { category: "firsts", prompt: "What's a 'first time' experience that you'll never forget?" },
    { category: "firsts", prompt: "Tell me about your first day at a new job or school." },
    { category: "weather", prompt: "What's your favorite weather memory?" },
    { category: "weather", prompt: "Tell me about a time when weather played a significant role in your day." },
    { category: "games", prompt: "What's a game or sport that brings back good memories?" },
    { category: "games", prompt: "Tell me about a fun competition or game you participated in." },
    { category: "technology", prompt: "What's a piece of technology that has significantly impacted your life?" },
    { category: "technology", prompt: "Tell me about your first experience with a new technology." },
    { category: "random", prompt: "What's something random that happened to you recently that made you smile?" },
    { category: "random", prompt: "Tell me about an ordinary moment that turned out to be extraordinary." }
  ];

  // Check if prompts already exist
  const existingPrompts = await db.select().from(memoryPrompts).limit(1);
  
  if (existingPrompts.length === 0) {
    await db.insert(memoryPrompts).values(defaultPrompts);
    console.log("Default prompts initialized");
  }
}