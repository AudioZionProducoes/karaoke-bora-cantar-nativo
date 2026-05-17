CREATE TABLE "musicas" (
	"id" integer PRIMARY KEY NOT NULL,
	"artista" text NOT NULL,
	"musica" text NOT NULL,
	"inicio" text,
	"has_video" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "karaoke_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"woocommerce_customer_id" text,
	"subscription_status" text DEFAULT 'active' NOT NULL,
	"access_granted" boolean DEFAULT true NOT NULL,
	"access_granted_at" timestamp with time zone DEFAULT now(),
	"expires_at" timestamp with time zone,
	"active_session_token" text,
	"active_session_at" timestamp with time zone,
	CONSTRAINT "karaoke_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "karaoke_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"queue" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"current_song_id" text,
	"current_singer_name" text,
	"current_song_started_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "access_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(16) NOT NULL,
	"duration_minutes" integer NOT NULL,
	"label" text,
	"used" boolean DEFAULT false NOT NULL,
	"used_at" timestamp with time zone,
	"used_by" text,
	"redeemer_name" text,
	"redeemer_email" text,
	"redeemer_whatsapp" text,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" integer,
	CONSTRAINT "access_codes_code_unique" UNIQUE("code")
);
