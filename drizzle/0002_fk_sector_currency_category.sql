-- Migration 0002: Add FK constraints for corporate_sectors, currencies, cost_center_categories
-- These tables were previously referenced by string code without FK enforcement.

-- corporates.industry → corporate_sectors(code)
ALTER TABLE "corporates"
  ADD CONSTRAINT "fk_corporates_industry"
    FOREIGN KEY ("industry") REFERENCES "corporate_sectors"("code");

-- corporates.currency → currencies(code)
ALTER TABLE "corporates"
  ADD CONSTRAINT "fk_corporates_currency"
    FOREIGN KEY ("currency") REFERENCES "currencies"("code");

-- cfd.cost_centers.category → cost_center_categories(code)
ALTER TABLE "cfd"."cost_centers"
  ADD CONSTRAINT "fk_cost_centers_category"
    FOREIGN KEY ("category") REFERENCES "cost_center_categories"("code");
