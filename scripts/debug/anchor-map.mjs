#!/usr/bin/env node
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSymbolIndex } from './symbol-index.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, '..', '..');

const ANCHORS = [
  { section: 'Run state', symbols: ['newStoryRun', 'load', 'save', 'SAVE_KEY', 'SAVE_VER'] },
  { section: 'Timeline', symbols: ['STORY_EVENTS_RAW', 'enterBattleEvent', 'proceedToNextBattle'] },
  { section: 'Migrations', symbols: ['migrateStoryPreV15'] },
  { section: 'Difficulty / coin', symbols: ['GYM_CITY_LEADER_EVENT'] },
  { section: 'RNG', symbols: ['storyRngNext', 'storyRngState'] },
  { section: 'Trainer rolling', symbols: ['rollTrainerTeam', 'rollMysteryFigureFinalBossTeam', 'makeBuild', 'makeWildBuild', 'makeDesignedBuild'] },
  { section: 'Story build tier', symbols: ['STORY_BUILD_TIER', '_storyBuildTierForEvent', '_storyDowngradeBuildForTier', '_applyStoryBuildPowerTier', '_storyBuildTierForProfessor'] },
  { section: 'Mechanics unlock gate', symbols: ['_withStoryPlayerGimmickGate', '_pbsStoryUsePlayerGimmickGate', '_storyEnemyMechKeys', '_minGuaranteedMechsForEvent', '_mechForGimmickRoll'] },
  { section: 'Mystery Figure / Professor', symbols: ['enterProfessor', 'isPreLeagueLegendaryMysteryGate'] },
  { section: 'Rival', symbols: ['setRivalStanding', 'getRivalEncounterPhase', 'pickStoryRivalSpriteFile'] },
  { section: 'City hub', symbols: ['enterCity', 'renderCityActions', 'getCurrentCityDisplayName', 'shouldForceCityProfessor'] },
  { section: 'Catch / PC / Safari', symbols: ['_pickStarterPartner'] },
  { section: 'Damage formula', symbols: ['parseMoveEffects', 'buildPokemon', 'ensureMoveData'] },
  { section: 'Tutorial scenes', symbols: ['STORY_TUTORIAL_SCENES', '_showStoryTutorialScene', 'playStoryTutorial'] },
  { section: 'Dialogue pools', symbols: ['TRAINER_QUOTES', 'TRAINER_QUOTES_BY_NAME', 'CITY_PROFESSOR_QUOTES', 'CITY_GUIDE_QUOTES', 'getTrainerQuoteForBattle'] },
  { section: 'Retreat / game-over', symbols: ['_storyCalcRetreatGoldFee', 'refreshStoryGameOverRetreatUI', 'acceptRivalLossAndContinue'] },
  { section: 'Tutor / EV trainer / Link / Colress', symbols: ['enterShop', 'enterArtifactShop'] },
  { section: 'Test harness', symbols: ['__testHarness', '__engine', '__testReady', 'sleep'] },
];

function render(index) {
  const ts = new Date().toISOString();
  const lines = [];
  lines.push('# Anchor Index — battle.html and siblings');
  lines.push('');
  lines.push(`> **Generated**: ${ts}`);
  lines.push('> **Source**: `node scripts/debug/anchor-map.mjs`');
  lines.push('');
  lines.push('Line numbers below are accurate as of generation. They drift on every');
  lines.push('insertion; agents should resolve via the `find-anchor` skill rather than');
  lines.push('trusting these numbers verbatim.');
  lines.push('');

  let total = 0, missing = 0;
  for (const { section, symbols } of ANCHORS) {
    lines.push(`## ${section}`);
    lines.push('');
    lines.push('| Symbol | File | Line | Kind |');
    lines.push('|---|---|---|---|');
    for (const sym of symbols) {
      total++;
      const hits = index[sym];
      if (!hits || hits.length === 0) {
        missing++;
        lines.push(`| \`${sym}\` | _not found_ | — | — |`);
      } else {
        for (const h of hits) {
          lines.push(`| \`${sym}\` | ${h.file} | ${h.line} | ${h.kind} |`);
        }
      }
    }
    lines.push('');
  }
  lines.push('---');
  lines.push('');
  lines.push(`**Resolved**: ${total - missing} / ${total} known anchors`);
  lines.push('');
  if (missing > 0) {
    lines.push('**Missing anchors** likely indicate one of:');
    lines.push('- Symbol was renamed (search adjacent symbols in the section above for context)');
    lines.push('- Symbol was removed (legitimate deletion; the anchor list in `anchor-map.mjs` should be updated)');
    lines.push('- Pattern in `symbol-index.mjs` is too strict (e.g., method on an object literal not picked up)');
    lines.push('');
  }
  return lines.join('\n');
}

function stripTimestamp(md) {
  return md.replace(/^>\s*\*\*Generated\*\*:.*$/m, '> **Generated**: <stripped>');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const index = buildSymbolIndex();
  const md = render(index);
  const outPath = join(REPO, 'agent-state', 'ANCHOR_INDEX.md');
  const resolved = ANCHORS.reduce((acc, s) => acc + s.symbols.filter(x => index[x]).length, 0);
  const totalCount = ANCHORS.reduce((acc, s) => acc + s.symbols.length, 0);
  if (existsSync(outPath) && stripTimestamp(readFileSync(outPath, 'utf8')) === stripTimestamp(md)) {
    console.log(`[anchor-map] unchanged (${resolved}/${totalCount} anchors) — skipping write`);
  } else {
    writeFileSync(outPath, md);
    console.log(`[anchor-map] wrote ${outPath} (${resolved}/${totalCount} anchors resolved)`);
  }
}
