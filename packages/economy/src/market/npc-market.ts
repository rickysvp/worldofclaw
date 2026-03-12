import { npc_market_entity_prefix } from "../constants";

export const getNpcMarketEntityId = (sector_id: string): string => `${npc_market_entity_prefix}_${sector_id}`;
