ALTER TABLE "cfd"."cost_centers" DROP CONSTRAINT "cost_centers_code_unique";--> statement-breakpoint
ALTER TABLE "cfd"."cash_realizations" ADD COLUMN "cost_center_id" uuid;--> statement-breakpoint
ALTER TABLE "cfd"."cost_centers" ADD COLUMN "corporate_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "cfd"."cash_realizations" ADD CONSTRAINT "cash_realizations_cost_center_id_cost_centers_id_fk" FOREIGN KEY ("cost_center_id") REFERENCES "cfd"."cost_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cfd"."cost_centers" ADD CONSTRAINT "cost_centers_corporate_id_corporates_id_fk" FOREIGN KEY ("corporate_id") REFERENCES "public"."corporates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cfd"."cost_centers" ADD CONSTRAINT "uq_cost_center_corp_code" UNIQUE("corporate_id","code");