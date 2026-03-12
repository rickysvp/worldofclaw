import { describe, expect, it } from "vitest";
import mapSeed from "../../seed/map.seed.json";
import sectorsSeed from "../../seed/sectors.seed.json";
import facilitiesSeed from "../../seed/facilities.seed.json";
import routesSeed from "../../seed/routes.seed.json";

describe("map seed smoke", () => {
  it("matches the expected M4 baseline", () => {
    expect(mapSeed.map_width).toBe(5);
    expect(mapSeed.map_height).toBe(5);
    expect(sectorsSeed.sectors).toHaveLength(25);
    expect(mapSeed.safe_zone_sector_ids).toHaveLength(2);
    expect(routesSeed.routes[0]?.sector_ids.length).toBeGreaterThanOrEqual(5);
    expect(facilitiesSeed.facilities.filter((facility) => facility.claimable)).toHaveLength(2);
  });
});
