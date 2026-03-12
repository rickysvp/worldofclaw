export const tick_duration_seconds = 600 as const;
export const map_width = 5 as const;
export const map_height = 5 as const;
export const day_length_ticks = 144 as const;
export const newbie_safe_ticks = 6 as const;
export const meteor_min_interval = 12 as const;
export const meteor_max_interval = 24 as const;

export const world_constants = {
  tick_duration_seconds,
  map_width,
  map_height,
  day_length_ticks,
  newbie_safe_ticks,
  meteor_min_interval,
  meteor_max_interval
} as const;

export const numeric_bounds = {
  tick_min: 0,
  tick_max: 10_000_000,
  stat_min: 0,
  stat_max: 1_000_000,
  signed_stat_min: -100_000,
  signed_stat_max: 100_000,
  level_min: 0,
  level_max: 100,
  cargo_min: 0,
  cargo_max: 1_000_000,
  credits_min: 0,
  credits_max: 1_000_000_000,
  coordinate_min: 0,
  coordinate_max_x: map_width - 1,
  coordinate_max_y: map_height - 1,
  version_min: 1,
  version_max: 1_000_000
} as const;
