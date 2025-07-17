const knex = require('../db/knex')
const dayjs = require('dayjs')

module.exports = async function digest(providedTimestamp = null) {
  const cutoffRaw = knex.raw('COALESCE(?, NOW() - INTERVAL 1 HOUR)', [providedTimestamp]);

  // Step 1: Get all recent segment_times
  const recent = await knex('segment_times')
    .select(
      'segment_times.id',
      'segment_times.player_id',
      'segment_times.segment_id',
      'segment_times.segment_time',
      'segment_times.posted_dtm',
      'segments.label as segment_label',
      'segments.is_full_run',
      'segments.timing_type',
      'segments.timing_inverted',
      'segments.game_id',
      'games.title as game_title',
      'games.slug as game_slug'
    )
    .join('segments', 'segment_times.segment_id', 'segments.id')
    .join('games', 'segments.game_id', 'games.id')
    .where('segment_times.posted_dtm', '>', cutoffRaw);

  // Step 2: Reduce to best time per player per segment (recent)
  const bestRecentMap = new Map();
  for (const row of recent) {
    const key = `${row.player_id}_${row.segment_id}`;
    const existing = bestRecentMap.get(key);
    const isBetter = row.timing_inverted
      ? !existing || row.segment_time > existing.segment_time
      : !existing || row.segment_time < existing.segment_time;
    if (isBetter) {
      bestRecentMap.set(key, row);
    }
  }

  const bestRecentTimes = Array.from(bestRecentMap.values());

  // Step 3: For each segment, fetch all best times (per player) for current + previous, compute placement
  async function getBestTimesPerPlayer(segment_id, timing_inverted, beforeCutoff = null) {
    let query = knex('segment_times')
      .select('player_id')
      .min('segment_time as segment_time')
      .where('segment_id', segment_id)
      .groupBy('player_id');

    if (beforeCutoff) {
      query = query.where('posted_dtm', '<=', beforeCutoff);
    }

    const rows = await query;

    return rows.sort((a, b) =>
      timing_inverted ? b.segment_time - a.segment_time : a.segment_time - b.segment_time
    );
  }

  const withPlacements = await Promise.all(
    bestRecentTimes.map(async (entry) => {
      // Current best times (all players)
      const currentBest = await getBestTimesPerPlayer(entry.segment_id, entry.timing_inverted);

      // Compute current placement
      let placement = currentBest.findIndex((r) => r.player_id === entry.player_id) + 1;
      let tied = false
      while (placement > 1 && currentBest[placement-2].segment_time == entry.segment_time) {
        placement--
        tied = true
      }

      // Previous best times (before cutoff)
      const previousBest = await getBestTimesPerPlayer(entry.segment_id, entry.timing_inverted, cutoffRaw);
      const previousPlacementEntry = previousBest.findIndex((r) => r.player_id === entry.player_id);
      const previousPlacement = previousPlacementEntry >= 0 ? previousPlacementEntry + 1 : null;

      return {
        ...entry,
        placement,
        previousPlacement,
        tied,
      };
    })
  );

  // Step 4: Gather unique player IDs and fetch metadata
  const uniquePlayerIds = Array.from(new Set(withPlacements.map(r => r.player_id)));

  const playersRaw = await knex('players')
    .select('id', 'username', 'avatar_url')
    .whereIn('id', uniquePlayerIds);

  const players = {};
  for (const player of playersRaw) {
    players[player.id] = player;
  }

  return {
    times: withPlacements,
    players
  };
}
