CREATE TABLE "cfd"."bank_loan_installments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bank_loan_id" uuid NOT NULL,
	"installment_date" date NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'unpaid' NOT NULL,
	"paid_date" date,
	CONSTRAINT "chk_installment_status" CHECK ("cfd"."bank_loan_installments"."status" IN ('paid', 'unpaid'))
);
--> statement-breakpoint
CREATE TABLE "cfd"."bank_loans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bank_id" uuid NOT NULL,
	"corporate_id" uuid NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"start_date" date NOT NULL,
	"tenor" integer NOT NULL,
	"interest_type" varchar(20) NOT NULL,
	"interest_rate" numeric(5, 4) NOT NULL,
	"status" varchar(20) DEFAULT 'ongoing' NOT NULL,
	"alert_min_days" integer DEFAULT 5 NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone,
	CONSTRAINT "chk_loan_interest_type" CHECK ("cfd"."bank_loans"."interest_type" IN ('flat', 'effective')),
	CONSTRAINT "chk_loan_status" CHECK ("cfd"."bank_loans"."status" IN ('ongoing', 'paid')),
	CONSTRAINT "chk_loan_tenor_positive" CHECK ("cfd"."bank_loans"."tenor" > 0)
);
--> statement-breakpoint
CREATE TABLE "cfd"."cash_realizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar(20) NOT NULL,
	"department_id" uuid NOT NULL,
	"project_id" uuid,
	"transaction_date" date NOT NULL,
	"category" varchar(20) NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"notes" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone,
	CONSTRAINT "chk_realization_entity_type" CHECK ("cfd"."cash_realizations"."entity_type" IN ('department', 'project')),
	CONSTRAINT "chk_realization_category" CHECK ("cfd"."cash_realizations"."category" IN ('cash-in', 'cash-out')),
	CONSTRAINT "chk_realization_project_required" CHECK (NOT ("cfd"."cash_realizations"."entity_type" = 'project' AND "cfd"."cash_realizations"."project_id" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_path" text NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "banks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"swift_code" varchar(20),
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone,
	CONSTRAINT "banks_code_unique" UNIQUE("code"),
	CONSTRAINT "chk_banks_status" CHECK ("banks"."status" IN ('active', 'inactive'))
);
--> statement-breakpoint
CREATE TABLE "corporate_sectors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"label_id" varchar(100) NOT NULL,
	"label_en" varchar(100) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone,
	CONSTRAINT "corporate_sectors_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "cost_center_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"label_id" varchar(100) NOT NULL,
	"label_en" varchar(100) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone,
	CONSTRAINT "cost_center_categories_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "currencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(10) NOT NULL,
	"label" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone,
	CONSTRAINT "currencies_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "notification_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module" varchar(50) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"role_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone,
	CONSTRAINT "uq_notification_config_module_event_role" UNIQUE("module","event_type","role_id")
);
--> statement-breakpoint
ALTER TABLE "cfd"."bank_loan_installments" ADD CONSTRAINT "bank_loan_installments_bank_loan_id_bank_loans_id_fk" FOREIGN KEY ("bank_loan_id") REFERENCES "cfd"."bank_loans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cfd"."bank_loans" ADD CONSTRAINT "bank_loans_bank_id_banks_id_fk" FOREIGN KEY ("bank_id") REFERENCES "public"."banks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cfd"."bank_loans" ADD CONSTRAINT "bank_loans_corporate_id_corporates_id_fk" FOREIGN KEY ("corporate_id") REFERENCES "public"."corporates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cfd"."cash_realizations" ADD CONSTRAINT "cash_realizations_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cfd"."cash_realizations" ADD CONSTRAINT "cash_realizations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_configs" ADD CONSTRAINT "notification_configs_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_attachments_entity" ON "attachments" USING btree ("entity_type","entity_id");