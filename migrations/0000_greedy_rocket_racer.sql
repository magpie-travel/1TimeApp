CREATE TABLE "memories" (
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
--> statement-breakpoint
CREATE TABLE "memory_prompts" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"prompt" text NOT NULL,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password" text,
	"name" text,
	"avatar_url" text,
	"provider" text DEFAULT 'email' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "memories" ADD CONSTRAINT "memories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;