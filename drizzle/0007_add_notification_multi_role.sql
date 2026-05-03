ALTER TABLE "notification_configs" DROP CONSTRAINT "notification_configs_role_id_roles_id_fk";--> statement-breakpoint
ALTER TABLE "notification_configs" DROP CONSTRAINT "uq_notification_config_module_event_role";--> statement-breakpoint
ALTER TABLE "notification_configs" DROP COLUMN "role_id";--> statement-breakpoint
ALTER TABLE "notification_configs" ADD COLUMN "target_roles" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_configs" ADD CONSTRAINT "uq_notification_config_module_event" UNIQUE("module","event_type");--> statement-breakpoint
CREATE TABLE "notification_broadcasts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message" text NOT NULL,
	"severity" varchar(20) DEFAULT 'medium' NOT NULL,
	"target_roles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"target_users" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"target_corporates" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"target_departments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"recipient_count" integer DEFAULT 0 NOT NULL,
	"sent_by" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "notification_broadcasts" ADD CONSTRAINT "notification_broadcasts_sent_by_users_id_fk" FOREIGN KEY ("sent_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
