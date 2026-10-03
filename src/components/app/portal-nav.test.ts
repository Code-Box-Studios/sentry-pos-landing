import { expect, it } from "vitest";
import { businessNav, portalNav } from "./portal-nav";
it("gives owners Staff and Settings without removing existing sections", () => {
  const labels = businessNav("business", "owner").map((item) => item.label);
  expect(labels).toContain("Staff"); expect(labels).toContain("Settings"); expect(labels).toContain("Products");
});
it("limits managers to operational navigation", () => {
  const labels = portalNav("manager").map((item) => item.label);
  expect(labels).toEqual(["Dashboard", "Analytics", "Stock", "Products", "Terminals", "Activity", "Alerts"]);
  const businessLabels = businessNav("business", "manager").map((item) => item.label);
  for (const label of ["Settings", "Staff", "Discounts", "Categories", "Modifiers"]) expect(businessLabels).not.toContain(label);
});
