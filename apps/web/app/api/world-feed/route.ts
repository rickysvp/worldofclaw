import { NextRequest, NextResponse } from "next/server";
import { getWorldFeed } from "../../../lib/mock-data";
import type { WorldFeedFilter } from "../../../lib/types";

export const dynamic = "force-dynamic";

const isWorldFeedFilter = (value: string): value is WorldFeedFilter =>
  ["all", "my_claw", "nearby", "market", "conflict", "organization"].includes(value);

export async function GET(request: NextRequest) {
  const filter_param = request.nextUrl.searchParams.get("filter");
  const filter: WorldFeedFilter = filter_param && isWorldFeedFilter(filter_param) ? filter_param : "all";
  return NextResponse.json(getWorldFeed(filter));
}
