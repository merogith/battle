import fs from "fs";
const s = fs.readFileSync("d:/pokemon battle/battle.html", "utf8");
const start = s.indexOf("const TRAINER_DATA = [");
const sub = s.slice(start, start + 950000);
const end = sub.indexOf("\n        ];");
const body = end > 0 ? sub.slice(0, end) : sub;
const re = /\{ role:'([^']+)', name:'((?:\\'|[^'])*)'/g;
const rows = [];
let m;
while ((m = re.exec(body)) !== null) {
  rows.push({ role: m[1], name: m[2].replace(/\\'/g, "'") });
}
const byRole = {};
for (const r of rows) {
  if (!byRole[r.role]) byRole[r.role] = [];
  byRole[r.role].push(r.name);
}
const rivalNames = new Set();
for (const line of body.split("\n")) {
  if (!line.includes("isRival:true")) continue;
  const nm = line.match(/name:'((?:\\'|[^'])*)'/);
  if (nm) rivalNames.add(nm[1].replace(/\\'/g, "'"));
}
const order = [
  "Basic Trainer",
  "Elite Trainer",
  "Gym Leader 1",
  "Gym Leader 2",
  "Gym Leader 3",
  "Gym Leader 4",
  "Gym Leader 5",
  "Gym Leader 6",
  "Gym Leader 7",
  "Gym Leader 8",
  "E1",
  "E2",
  "E3",
  "E4",
  "Champion",
];
const extra = Object.keys(byRole)
  .filter((k) => !order.includes(k))
  .sort();
const allKeys = [...order.filter((k) => byRole[k]), ...extra];
const eliteAll = byRole["Elite Trainer"] || [];
const eliteNonRival = eliteAll.filter((n) => !rivalNames.has(n));
const out = {
  totalRows: rows.length,
  storyEventPools: {
    "Basic Trainer / Gym Trainer / Gym Trainer 1 / Gym Trainer 2": {
      count: (byRole["Basic Trainer"] || []).length,
      note: "Gym Trainer 1/2 have no matching role rows; selection falls back to full TRAINER_DATA.",
      names: byRole["Basic Trainer"] || [],
    },
    "Elite Trainer (story battle)": {
      count: eliteNonRival.length,
      names: eliteNonRival,
      note: "Story picks use selectTrainerForRole('Elite Trainer'), which excludes isRival (rivals only via event 'Rival').",
      nonRivalOnly_count: eliteNonRival.length,
      nonRivalOnly_names: eliteNonRival,
      allEliteTrainer_rows_including_rivals_count: eliteAll.length,
      allEliteTrainer_rows_including_rivals_names: eliteAll,
    },
    Rival: {
      count: rivalNames.size,
      names: [...rivalNames].sort(),
    },
    Mystery_Figure: {
      count: 0,
      note: "Synthetic trainer ??? Mystery Figure — not in TRAINER_DATA.",
    },
  },
  byRole: Object.fromEntries(allKeys.map((k) => [k, byRole[k] || []])),
};
console.log(JSON.stringify(out, null, 2));
