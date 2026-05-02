ALTER TABLE "cfd"."bank_loans" ADD COLUMN "credit_type" varchar(20) DEFAULT 'KMK' NOT NULL;--> statement-breakpoint
ALTER TABLE "cfd"."income_statements" ADD COLUMN "other_income" numeric(18, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "cfd"."income_statements" ADD COLUMN "other_expense" numeric(18, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "cfd"."bank_loans" ADD CONSTRAINT "chk_loan_credit_type" CHECK ("cfd"."bank_loans"."credit_type" IN ('KMK', 'KMI'));