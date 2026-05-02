CREATE TABLE "cfd"."cash_flow_projection_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"header_id" uuid NOT NULL,
	"month" integer NOT NULL,
	"group" varchar(50) NOT NULL,
	"type" varchar(20) NOT NULL,
	"category" varchar(100) NOT NULL,
	"amount" numeric(18, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	CONSTRAINT "chk_projection_month" CHECK ("cfd"."cash_flow_projection_details"."month" >= 1 AND "cfd"."cash_flow_projection_details"."month" <= 12),
	CONSTRAINT "chk_projection_group" CHECK ("cfd"."cash_flow_projection_details"."group" IN ('operating', 'investing', 'financing')),
	CONSTRAINT "chk_projection_type" CHECK ("cfd"."cash_flow_projection_details"."type" IN ('cash-in', 'cash-out'))
);
--> statement-breakpoint
CREATE TABLE "cfd"."cash_flow_projection_headers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"corporate_id" uuid NOT NULL,
	"fiscal_year" integer NOT NULL,
	"initial_balance" numeric(18, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone,
	CONSTRAINT "uq_cf_projection_header" UNIQUE("corporate_id","fiscal_year")
);
--> statement-breakpoint
ALTER TABLE "cfd"."cash_flow_projection_details" ADD CONSTRAINT "cash_flow_projection_details_header_id_cash_flow_projection_headers_id_fk" FOREIGN KEY ("header_id") REFERENCES "cfd"."cash_flow_projection_headers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cfd"."cash_flow_projection_headers" ADD CONSTRAINT "cash_flow_projection_headers_corporate_id_corporates_id_fk" FOREIGN KEY ("corporate_id") REFERENCES "public"."corporates"("id") ON DELETE no action ON UPDATE no action;