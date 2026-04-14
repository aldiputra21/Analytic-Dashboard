CREATE SCHEMA "cfd";
--> statement-breakpoint
CREATE SCHEMA "crm";
--> statement-breakpoint
CREATE TABLE "cfd"."alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"corporate_id" uuid NOT NULL,
	"department_id" uuid,
	"ratio_name" varchar(50) NOT NULL,
	"severity" varchar(20) NOT NULL,
	"current_value" numeric(10, 4) NOT NULL,
	"threshold_value" numeric(10, 4) NOT NULL,
	"message" text NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"acknowledged_at" timestamp with time zone,
	"acknowledged_by" uuid,
	"period" varchar(7) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cfd"."balance_sheets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department_id" uuid NOT NULL,
	"period" varchar(7) NOT NULL,
	"cash_and_bank" numeric(18, 2) DEFAULT '0' NOT NULL,
	"accounts_receivable" numeric(18, 2) DEFAULT '0' NOT NULL,
	"work_in_progress" numeric(18, 2) DEFAULT '0' NOT NULL,
	"inventory" numeric(18, 2) DEFAULT '0' NOT NULL,
	"prepaid_expenses" numeric(18, 2) DEFAULT '0' NOT NULL,
	"land" numeric(18, 2) DEFAULT '0' NOT NULL,
	"building" numeric(18, 2) DEFAULT '0' NOT NULL,
	"equipment" numeric(18, 2) DEFAULT '0' NOT NULL,
	"other_fixed_assets" numeric(18, 2) DEFAULT '0' NOT NULL,
	"accounts_payable" numeric(18, 2) DEFAULT '0' NOT NULL,
	"bank_loan_current" numeric(18, 2) DEFAULT '0' NOT NULL,
	"other_current_liabilities" numeric(18, 2) DEFAULT '0' NOT NULL,
	"bank_loan_long_term" numeric(18, 2) DEFAULT '0' NOT NULL,
	"other_long_term_liabilities" numeric(18, 2) DEFAULT '0' NOT NULL,
	"shareholder_loan" numeric(18, 2) DEFAULT '0' NOT NULL,
	"capital" numeric(18, 2) DEFAULT '0' NOT NULL,
	"earnings_after_tax" numeric(18, 2) DEFAULT '0' NOT NULL,
	"retained_earnings" numeric(18, 2) DEFAULT '0' NOT NULL,
	"dividends" numeric(18, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"created_by" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(100),
	"updated_at" timestamp with time zone,
	CONSTRAINT "uq_balance_sheet_dept_period" UNIQUE("department_id","period")
);
--> statement-breakpoint
CREATE TABLE "cfd"."income_statements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department_id" uuid NOT NULL,
	"period" varchar(7) NOT NULL,
	"revenue" numeric(18, 2) DEFAULT '0' NOT NULL,
	"cogs" numeric(18, 2) DEFAULT '0' NOT NULL,
	"operating_expenses" numeric(18, 2) DEFAULT '0' NOT NULL,
	"interest_expense" numeric(18, 2) DEFAULT '0' NOT NULL,
	"tax_expense" numeric(18, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"created_by" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(100),
	"updated_at" timestamp with time zone,
	CONSTRAINT "uq_income_stmt_dept_period" UNIQUE("department_id","period")
);
--> statement-breakpoint
CREATE TABLE "cfd"."target_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"target_header_id" uuid NOT NULL,
	"target_type" varchar(20) NOT NULL,
	"cost_center" varchar(100),
	"amount" numeric(18, 2) NOT NULL,
	"notes" text,
	CONSTRAINT "uq_target_detail" UNIQUE("target_header_id","target_type","cost_center")
);
--> statement-breakpoint
CREATE TABLE "cfd"."target_headers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department_id" uuid NOT NULL,
	"project_id" uuid,
	"fiscal_year" integer NOT NULL,
	"fiscal_month" integer NOT NULL,
	"notes" text,
	"created_by" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(100),
	"updated_at" timestamp with time zone,
	CONSTRAINT "uq_target_header" UNIQUE("department_id","project_id","fiscal_year","fiscal_month"),
	CONSTRAINT "fiscal_month_check" CHECK ("cfd"."target_headers"."fiscal_month" >= 1 AND "cfd"."target_headers"."fiscal_month" <= 12)
);
--> statement-breakpoint
CREATE TABLE "cfd"."thresholds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"corporate_id" uuid NOT NULL,
	"ratio_name" varchar(50) NOT NULL,
	"thresholds" jsonb NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_by" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(100),
	"updated_at" timestamp with time zone,
	CONSTRAINT "uq_threshold_corporate_ratio" UNIQUE("corporate_id","ratio_name")
);
--> statement-breakpoint
CREATE TABLE "cfd"."weekly_cash_flows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department_id" uuid NOT NULL,
	"entity_type" varchar(20) NOT NULL,
	"entity_id" uuid NOT NULL,
	"period" varchar(7) NOT NULL,
	"week" varchar(2) NOT NULL,
	"operating_cash_in" numeric(18, 2) DEFAULT '0' NOT NULL,
	"operating_cash_out" numeric(18, 2) DEFAULT '0' NOT NULL,
	"investing_cash_in" numeric(18, 2) DEFAULT '0' NOT NULL,
	"investing_cash_out" numeric(18, 2) DEFAULT '0' NOT NULL,
	"financing_cash_in" numeric(18, 2) DEFAULT '0' NOT NULL,
	"financing_cash_out" numeric(18, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"created_by" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(100),
	"updated_at" timestamp with time zone,
	CONSTRAINT "uq_cash_flow_entity_period_week" UNIQUE("entity_type","entity_id","period","week"),
	CONSTRAINT "week_check" CHECK ("cfd"."weekly_cash_flows"."week" IN ('W1', 'W2', 'W3', 'W4', 'W5')),
	CONSTRAINT "entity_type_check" CHECK ("cfd"."weekly_cash_flows"."entity_type" IN ('department', 'project'))
);
--> statement-breakpoint
CREATE TABLE "crm"."competitors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"competitor_name" varchar(200) NOT NULL,
	"estimated_bid_value" numeric(18, 2),
	"notes" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm"."contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"title" varchar(100),
	"phone" varchar(30),
	"email" varchar(255),
	"role" varchar(20),
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm"."contract_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_path" text NOT NULL,
	"file_size" integer NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm"."contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"contract_number" varchar(50),
	"title" varchar(200) NOT NULL,
	"customer_id" uuid NOT NULL,
	"value" numeric(18, 2) NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"scope_of_work" text,
	"status" varchar(30) DEFAULT 'Draft' NOT NULL,
	"signed_at" timestamp with time zone,
	"signed_by" varchar(100),
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(100),
	"updated_at" timestamp with time zone,
	CONSTRAINT "contracts_contract_number_unique" UNIQUE("contract_number")
);
--> statement-breakpoint
CREATE TABLE "crm"."cost_estimations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"material_cost" numeric(18, 2) DEFAULT '0' NOT NULL,
	"labor_cost" numeric(18, 2) DEFAULT '0' NOT NULL,
	"equipment_cost" numeric(18, 2) DEFAULT '0' NOT NULL,
	"subcontractor_cost" numeric(18, 2) DEFAULT '0' NOT NULL,
	"overhead_cost" numeric(18, 2) DEFAULT '0' NOT NULL,
	"total_cost" numeric(18, 2) NOT NULL,
	"opportunity_value" numeric(18, 2) NOT NULL,
	"margin_percentage" numeric(5, 2) NOT NULL,
	"resource_plan" text,
	"notes" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm"."customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" varchar(200) NOT NULL,
	"industry" varchar(100) NOT NULL,
	"address" text,
	"npwp" varchar(30),
	"parent_customer_id" uuid,
	"status" varchar(20) DEFAULT 'Active' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(100),
	"updated_at" timestamp with time zone,
	CONSTRAINT "uq_customer_name_npwp" UNIQUE("company_name","npwp")
);
--> statement-breakpoint
CREATE TABLE "crm"."interactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"entity_type" varchar(20) NOT NULL,
	"type" varchar(20) NOT NULL,
	"interaction_date" timestamp NOT NULL,
	"summary" text NOT NULL,
	"next_action" text,
	"next_action_date" timestamp,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm"."opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"customer_id" uuid NOT NULL,
	"corporate_id" uuid NOT NULL,
	"stage" varchar(20) DEFAULT 'Lead' NOT NULL,
	"status" varchar(20) DEFAULT 'Active' NOT NULL,
	"estimated_value" numeric(18, 2),
	"probability" integer DEFAULT 10 NOT NULL,
	"assigned_to" uuid NOT NULL,
	"description" text,
	"tender_name" varchar(200),
	"tender_estimated_value" numeric(18, 2),
	"tender_announcement_date" timestamp,
	"close_reason" text,
	"close_category" varchar(20),
	"closed_at" timestamp with time zone,
	"closed_by" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(100),
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "crm"."opportunity_value_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"old_value" numeric(18, 2),
	"new_value" numeric(18, 2) NOT NULL,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm"."proposal_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" uuid NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_path" text NOT NULL,
	"file_size" integer NOT NULL,
	"file_type" varchar(10),
	"uploaded_by" uuid NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm"."proposal_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" uuid NOT NULL,
	"version" varchar(10) NOT NULL,
	"snapshot" jsonb NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm"."proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"version" varchar(10) DEFAULT 'v1.0' NOT NULL,
	"title" varchar(200) NOT NULL,
	"template_id" uuid,
	"content" text,
	"status" varchar(30) DEFAULT 'Draft' NOT NULL,
	"submission_deadline" timestamp,
	"submitted_at" timestamp with time zone,
	"submitted_by" uuid,
	"submission_method" varchar(50),
	"client_feedback" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(100),
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "crm"."qualifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"technical_capability_score" integer,
	"resource_availability_score" integer,
	"contract_value_score" integer,
	"estimated_margin_score" integer,
	"risk_score" integer,
	"feasibility_score" numeric(5, 2) NOT NULL,
	"recommendation" varchar(20),
	"notes" text,
	"resource_plan" text,
	"status" varchar(20) DEFAULT 'Draft' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "crm"."sales_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"period" varchar(10) NOT NULL,
	"target_revenue" numeric(18, 2) NOT NULL,
	"target_deals" integer,
	"set_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_sales_target_user_period" UNIQUE("user_id","period")
);
--> statement-breakpoint
CREATE TABLE "crm"."stage_transitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"from_stage" varchar(20),
	"to_stage" varchar(20) NOT NULL,
	"transitioned_by" uuid NOT NULL,
	"transitioned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "approval_histories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"approval_id" uuid NOT NULL,
	"step_id" uuid NOT NULL,
	"action" varchar(20) NOT NULL,
	"acted_by" uuid NOT NULL,
	"comments" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_workflow_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"step_order" integer NOT NULL,
	"step_type" varchar(20) NOT NULL,
	"required_role" varchar(50) NOT NULL,
	"condition" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_workflow_step_order" UNIQUE("workflow_id","step_order")
);
--> statement-breakpoint
CREATE TABLE "approval_workflows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module" varchar(50) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"action" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"callback_handler" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(100),
	"updated_at" timestamp with time zone,
	CONSTRAINT "uq_workflow_module_entity_action" UNIQUE("module","entity_type","action")
);
--> statement-breakpoint
CREATE TABLE "approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"current_step_id" uuid,
	"module" varchar(50) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid,
	"payload" jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"requested_by" uuid NOT NULL,
	"approved_by" uuid,
	"department_id" uuid,
	"metadata" jsonb,
	"rejection_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department_id" uuid,
	"user_id" uuid,
	"module" varchar(50),
	"action" varchar(50) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid,
	"old_values" jsonb,
	"new_values" jsonb,
	"justification" text,
	"ip_address" "inet",
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "corporates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(10) NOT NULL,
	"logo" text,
	"industry" varchar(50),
	"fiscal_year_start_month" integer DEFAULT 1 NOT NULL,
	"currency" varchar(10) DEFAULT 'IDR' NOT NULL,
	"tax_rate" numeric(5, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(100),
	"updated_at" timestamp with time zone,
	CONSTRAINT "corporates_code_unique" UNIQUE("code"),
	CONSTRAINT "fiscal_month_check" CHECK ("corporates"."fiscal_year_start_month" >= 1 AND "corporates"."fiscal_year_start_month" <= 12)
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"corporate_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(20) NOT NULL,
	"description" text,
	"head_name" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(100),
	"updated_at" timestamp with time zone,
	CONSTRAINT "uq_dept_corporate_code" UNIQUE("corporate_id","code")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"source_type" varchar(20) DEFAULT 'manual' NOT NULL,
	"source_id" uuid,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(100),
	"updated_at" timestamp with time zone,
	CONSTRAINT "uq_project_dept_code" UNIQUE("department_id","code")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"scope" varchar(20) NOT NULL,
	"permissions" jsonb NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(100),
	"updated_at" timestamp with time zone,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "system_configs" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"description" text,
	"created_by" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(100),
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_corporate_accesses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"scope" varchar(20) NOT NULL,
	"corporate_id" uuid,
	"department_id" uuid,
	"granted_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_scope" CHECK (
    ("user_corporate_accesses"."scope" = 'system' AND "user_corporate_accesses"."corporate_id" IS NULL AND "user_corporate_accesses"."department_id" IS NULL) OR
    ("user_corporate_accesses"."scope" = 'corporate' AND "user_corporate_accesses"."corporate_id" IS NOT NULL AND "user_corporate_accesses"."department_id" IS NULL) OR
    ("user_corporate_accesses"."scope" = 'department' AND "user_corporate_accesses"."corporate_id" IS NOT NULL AND "user_corporate_accesses"."department_id" IS NOT NULL)
  )
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"full_name" varchar(100) NOT NULL,
	"avatar_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"password_changed_at" timestamp with time zone,
	"failed_login_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"last_login" timestamp with time zone,
	"created_by" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(100),
	"updated_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "cfd"."alerts" ADD CONSTRAINT "alerts_corporate_id_corporates_id_fk" FOREIGN KEY ("corporate_id") REFERENCES "public"."corporates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cfd"."alerts" ADD CONSTRAINT "alerts_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cfd"."alerts" ADD CONSTRAINT "alerts_acknowledged_by_users_id_fk" FOREIGN KEY ("acknowledged_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cfd"."balance_sheets" ADD CONSTRAINT "balance_sheets_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cfd"."income_statements" ADD CONSTRAINT "income_statements_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cfd"."target_details" ADD CONSTRAINT "target_details_target_header_id_target_headers_id_fk" FOREIGN KEY ("target_header_id") REFERENCES "cfd"."target_headers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cfd"."target_headers" ADD CONSTRAINT "target_headers_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cfd"."target_headers" ADD CONSTRAINT "target_headers_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cfd"."thresholds" ADD CONSTRAINT "thresholds_corporate_id_corporates_id_fk" FOREIGN KEY ("corporate_id") REFERENCES "public"."corporates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cfd"."weekly_cash_flows" ADD CONSTRAINT "weekly_cash_flows_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."competitors" ADD CONSTRAINT "competitors_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "crm"."opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."competitors" ADD CONSTRAINT "competitors_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."contacts" ADD CONSTRAINT "contacts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "crm"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."contract_documents" ADD CONSTRAINT "contract_documents_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "crm"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."contract_documents" ADD CONSTRAINT "contract_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."contracts" ADD CONSTRAINT "contracts_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "crm"."opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."contracts" ADD CONSTRAINT "contracts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "crm"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."contracts" ADD CONSTRAINT "contracts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."cost_estimations" ADD CONSTRAINT "cost_estimations_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "crm"."opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."cost_estimations" ADD CONSTRAINT "cost_estimations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."customers" ADD CONSTRAINT "customers_parent_customer_id_customers_id_fk" FOREIGN KEY ("parent_customer_id") REFERENCES "crm"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."customers" ADD CONSTRAINT "customers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."interactions" ADD CONSTRAINT "interactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."opportunities" ADD CONSTRAINT "opportunities_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "crm"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."opportunities" ADD CONSTRAINT "opportunities_corporate_id_corporates_id_fk" FOREIGN KEY ("corporate_id") REFERENCES "public"."corporates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."opportunities" ADD CONSTRAINT "opportunities_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."opportunities" ADD CONSTRAINT "opportunities_closed_by_users_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."opportunities" ADD CONSTRAINT "opportunities_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."opportunity_value_history" ADD CONSTRAINT "opportunity_value_history_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "crm"."opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."opportunity_value_history" ADD CONSTRAINT "opportunity_value_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."proposal_documents" ADD CONSTRAINT "proposal_documents_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "crm"."proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."proposal_documents" ADD CONSTRAINT "proposal_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."proposal_versions" ADD CONSTRAINT "proposal_versions_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "crm"."proposals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."proposal_versions" ADD CONSTRAINT "proposal_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."proposals" ADD CONSTRAINT "proposals_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "crm"."opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."proposals" ADD CONSTRAINT "proposals_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."proposals" ADD CONSTRAINT "proposals_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."qualifications" ADD CONSTRAINT "qualifications_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "crm"."opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."qualifications" ADD CONSTRAINT "qualifications_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."sales_targets" ADD CONSTRAINT "sales_targets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."sales_targets" ADD CONSTRAINT "sales_targets_set_by_users_id_fk" FOREIGN KEY ("set_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."stage_transitions" ADD CONSTRAINT "stage_transitions_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "crm"."opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm"."stage_transitions" ADD CONSTRAINT "stage_transitions_transitioned_by_users_id_fk" FOREIGN KEY ("transitioned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_histories" ADD CONSTRAINT "approval_histories_approval_id_approvals_id_fk" FOREIGN KEY ("approval_id") REFERENCES "public"."approvals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_histories" ADD CONSTRAINT "approval_histories_step_id_approval_workflow_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."approval_workflow_steps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_histories" ADD CONSTRAINT "approval_histories_acted_by_users_id_fk" FOREIGN KEY ("acted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_workflow_steps" ADD CONSTRAINT "approval_workflow_steps_workflow_id_approval_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."approval_workflows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_workflow_id_approval_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."approval_workflows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_current_step_id_approval_workflow_steps_id_fk" FOREIGN KEY ("current_step_id") REFERENCES "public"."approval_workflow_steps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_corporate_id_corporates_id_fk" FOREIGN KEY ("corporate_id") REFERENCES "public"."corporates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_corporate_accesses" ADD CONSTRAINT "user_corporate_accesses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_corporate_accesses" ADD CONSTRAINT "user_corporate_accesses_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_corporate_accesses" ADD CONSTRAINT "user_corporate_accesses_corporate_id_corporates_id_fk" FOREIGN KEY ("corporate_id") REFERENCES "public"."corporates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_corporate_accesses" ADD CONSTRAINT "user_corporate_accesses_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_corporate_accesses" ADD CONSTRAINT "user_corporate_accesses_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_uca_dept" ON "user_corporate_accesses" USING btree ("user_id","role_id","department_id") WHERE "user_corporate_accesses"."scope" = 'department';--> statement-breakpoint
CREATE UNIQUE INDEX "uq_uca_corporate" ON "user_corporate_accesses" USING btree ("user_id","role_id","corporate_id") WHERE "user_corporate_accesses"."scope" = 'corporate';--> statement-breakpoint
CREATE UNIQUE INDEX "uq_uca_system" ON "user_corporate_accesses" USING btree ("user_id","role_id") WHERE "user_corporate_accesses"."scope" = 'system';