import { describe, expect, it } from "vitest";
import { allNavigationItems, mobileNavigation, navigationGroups } from "@/config/navigation";

describe("application navigation", () => {
  it("keeps desktop destinations unique and labeled", () => {
    const destinations = allNavigationItems.map((item) => item.href);

    expect(new Set(destinations).size).toBe(destinations.length);
    expect(allNavigationItems.every((item) => item.href.startsWith("/") && item.label.length > 0)).toBe(true);
    expect(navigationGroups.map((group) => group.label)).toEqual([
      "Vue d’ensemble",
      "Travail",
      "Référentiel",
      "Plus",
    ]);
  });

  it("limits the mobile bar to five reachable destinations", () => {
    expect(mobileNavigation).toHaveLength(5);
    expect(mobileNavigation.map((item) => item.href)).toEqual([
      "/",
      "/tasks",
      "/calendar",
      "/documents",
      "/more",
    ]);
  });
});

