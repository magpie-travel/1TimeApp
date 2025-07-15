# Database Setup for 1time.ai

## Current Status
Your 1time.ai app is currently running with **in-memory storage**. This means:
- ✅ All features work perfectly 
- ✅ Fast performance during development
- ⚠️ Data is lost when the server restarts
- ⚠️ Not suitable for production use

## Database Options

### Option 1: Use Your Existing Supabase Database
If you already have a Supabase project and want to use it:

1. **Get your database URL from Supabase:**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard/projects)
   - Select your project
   - Click "Connect" button
   - Copy the URI from "Connection string" → "Transaction pooler"
   - Replace `[YOUR-PASSWORD]` with your actual password

2. **Update your secrets:**
   - Replace the current `DATABASE_URL` in Replit Secrets with your Supabase URL

3. **Enable database storage:**
   - Uncomment the database imports in `server/db-storage.ts`
   - Update `server/storage.ts` to use `DatabaseStorage` instead of `MemStorage`
   - The app will automatically create the necessary tables

### Option 2: Use Local PostgreSQL (Recommended for Development)
The app comes with a local PostgreSQL database that's ready to use:

1. **Switch to database storage:**
   ```typescript
   // In server/storage.ts, change:
   export const storage = new MemStorage();
   // To:
   export const storage = new DatabaseStorage();
   ```

2. **Enable database initialization:**
   ```typescript
   // In server/index.ts, uncomment:
   await initializeDatabase();
   ```

3. **The database will automatically:**
   - Create all necessary tables
   - Set up relationships
   - Load default memory prompts

### Option 3: Create a New Supabase Project
If you don't have a Supabase account:

1. **Create account:** Go to [supabase.com](https://supabase.com) and sign up
2. **Create project:** Click "New project" and follow the setup
3. **Get database URL:** Follow steps from Option 1
4. **Update secrets:** Add the URL to your Replit Secrets as `DATABASE_URL`

## Database Schema
The app uses three main tables:

### Users Table
- `id` (UUID): Primary key
- `email` (text): User's email address
- `password` (text): Hashed password
- `name` (text): User's display name
- `avatar_url` (text): Profile picture URL
- `provider` (text): Authentication provider (email/google/apple)
- `created_at` (timestamp): Account creation date

### Memories Table
- `id` (UUID): Primary key
- `user_id` (UUID): Links to users table
- `type` (text): Memory type (text/audio/mixed)
- `content` (text): Memory content
- `transcript` (text): Audio transcription
- `audio_url` (text): Audio file URL
- `audio_duration` (integer): Audio length in seconds
- `people` (text[]): Array of people mentioned
- `location` (text): Memory location
- `emotion` (text): Detected emotion
- `date` (timestamp): Memory date
- `prompt` (text): AI prompt used (if any)
- `is_public` (boolean): Sharing status
- `share_token` (text): Sharing token
- `created_at` (timestamp): Creation date
- `updated_at` (timestamp): Last update

### Memory Prompts Table
- `id` (serial): Primary key
- `category` (text): Prompt category
- `prompt` (text): Prompt text
- `is_active` (boolean): Active status

## Benefits of Using Database Storage

### Data Persistence
- Memories survive server restarts
- User accounts remain intact
- No data loss during development

### Advanced Features
- Full-text search across memories
- Complex filtering by date, emotion, people
- Efficient pagination for large datasets
- Relationship queries between users and memories

### Production Ready
- Scalable storage solution
- Backup and recovery capabilities
- Multi-user support
- Data integrity constraints

## Migration Process

The switch from in-memory to database storage is seamless:
1. No data migration needed (start fresh)
2. All API endpoints remain the same
3. Frontend code requires no changes
4. All existing features continue to work

## Next Steps

Choose your preferred database option above and I'll help you implement it. The database setup is designed to be:
- **Simple**: One-line configuration change
- **Automatic**: Tables and data are created automatically
- **Safe**: No risk of breaking existing functionality

Let me know which option you'd prefer and I'll guide you through the setup process!