#!/usr/bin/env python3
"""Reconcile source, release and playtest inventories without launching the game."""

import argparse
from collections import Counter, defaultdict
import csv
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import subprocess
from urllib.parse import unquote

from game_scope import build_scope, classic_view_kind, render_scope, source_block


ROOT = Path(__file__).resolve().parents[2]
REGISTER = ROOT / 'docs/PLAYTEST_COVERAGE_REGISTER.csv'
ROOT_GROUPS = {
    'app and shared views': 'battle.html index.html game-upgrades.js game-upgrades.css home-menu.css world-location.css story-activities.css world-presentation.js',
    'combat presentation': 'battle-motion.js battle-move-profiles.js battle-encounter-profiles.js move-anim-map.js move-sfx-map.js',
    'online transport and configuration': 'online-config.js online-config.example.js online-pvp.js',
    'app delivery': 'game-update.js sw.js manifest.webmanifest offline-assets.json .nojekyll',
    'build configuration': 'package.json package-lock.json .eslintignore .eslintrc.json .gitignore .gitattributes',
    'developer instructions': 'AGENTS.md',
    'guides and attribution': 'ATTRIBUTION.md CHANGELOG.md CLAUDE.md README.md RECOVERY_STATUS.md STORY_MODE_FLOW.md',
    'development inputs': 'tmp-pd.mjs trainerlist_files.txt',
}
ROOT_OWNERS = {path: group for group, paths in ROOT_GROUPS.items() for path in paths.split()}
DIRECTORY_OWNERS = {
    '.claude': 'developer instructions', '.cursor': 'developer instructions',
    '.github': 'CI and publishing', 'agent-state': 'historical evidence',
    'competitive': 'competitive and simulation', 'data': 'authored and imported data',
    'design': 'design sources', 'docs': 'guides and attribution', 'fonts': 'font assets',
    'icons': 'icon assets', 'music': 'audio assets', 'scripts': 'build and QA tools',
    'sprites': 'image assets and sprite indexes', 'supabase': 'database migrations',
    'tests': 'tests and fixtures', 'vendor': 'vendored dependencies',
}


class Surfaces(HTMLParser):
    def __init__(self):
        super().__init__()
        self.entries = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if not attrs.get('id'):
            return
        if kind := classic_view_kind(attrs, tag):
            self.entries.append({'id': attrs['id'], 'kind': kind, 'line': self.getpos()[0]})


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT, text=True)


def read_json(path):
    return json.loads((ROOT / path).read_text(encoding='utf-8'))


def compare(expected, registered):
    return {'source': len(expected), 'registered': len(registered),
            'missing': sorted(expected - registered), 'stale': sorted(registered - expected)}


def inspect_catalogs(source, surfaces, rows):
    by_stream = defaultdict(list)
    for row in rows:
        if row['status'] != 'retired':
            by_stream[row['workstream']].append(row)

    def entries(stream, column='entry_key'):
        return {row[column] for row in by_stream[stream]}

    timeline = source_block(source, 'const STORY_EVENTS_RAW = [', '\n        ];')
    camp = source_block(source, 'const CAMP_MICROGAMES = {', '\n        };')
    achievements = source_block(source, 'const STORY_ACHIEVEMENTS = [', '\n        ];')
    story = read_json('data/story/narrative-revision.json')['scenes']
    chapters = [record for group in ('opening', 'early', 'middle', 'finale')
                for record in read_json(f'data/story/adventure-{group}.json')]
    voice = ROOT / 'data/story/dialogue-lines.js'
    definitions = {
        'static-screen': {row['id'] for row in surfaces if row['kind'] == 'screen'},
        'static-dialog': {row['id'] for row in surfaces if row['kind'] == 'modal'},
        'timeline': {f'timeline.row-{int(key):03d}' for key in re.findall(r'^\s*\[(\d+),', timeline, re.M)},
        'main-scenes': {key for key in story if key.startswith('main.')},
        'faction-scenes': {key for key in story if key.startswith('villain.')},
        'anomaly-scenes': {key for key in story if key.startswith('extra.')},
        'bosses': set(read_json('data/story/boss-profiles.json')),
        'narrative-minigames': set(read_json('data/story/minigames.json')['games']),
        'errands': {row['id'] for row in read_json('data/story/errands.json')['errands']},
        'camp': set(re.findall(r'^\s+(\w+):\s*\{ primitive:', camp, re.M)),
        'achievements': set(re.findall(r"^\s*\{ id: '([^']+)'", achievements, re.M)),
        'voice-routing': set(re.findall(r'^    "([^"]+)": \{', voice.read_text(encoding='utf-8'), re.M)),
    }
    result = {name: compare(keys, entries(name)) for name, keys in definitions.items()}
    defaults = {
        name: (origin, definitions[name]) for name, origin in {
            'main-scenes': 'data/story/narrative-revision.json',
            'faction-scenes': 'data/story/narrative-revision.json',
            'anomaly-scenes': 'data/story/narrative-revision.json',
            'bosses': 'data/story/boss-profiles.json',
            'narrative-minigames': 'data/story/minigames.json',
            'errands': 'data/story/errands.json',
            'camp': 'battle.html',
            'achievements': 'battle.html',
            'voice-routing': 'data/story/dialogue-lines.js',
        }.items()
    }
    roads = read_json('data/story/campaign.json')['roads']
    road_outcomes = {f'road.{key}.{choice}' for key, choices in roads.items() for choice in choices}
    chapter_outcomes = {f"chapter.{chapter['id']}.{case}" for chapter in chapters for case in
                        [*(option['id'] for option in chapter['choices']), 'secret.open', 'secret.locked']}
    result['road-outcomes'] = compare(road_outcomes, entries('roads', 'case_id'))
    result['chapter-outcomes'] = compare(chapter_outcomes, entries('chapters', 'case_id'))
    interactions = read_json('data/story/interactions.json')['inject']
    interaction_ids = {f"{row['sceneKey']}.{row['phase']}" for row in interactions}
    result['narrative-interactions'] = compare(
        interaction_ids,
        {f"{row['entry_key']}.{row['case_id'].rsplit('.', 1)[-1]}" for row in by_stream['narrative-interactions']},
    )
    defaults.update({
        'road-outcomes': ('data/story/campaign.json', road_outcomes),
        'chapter-outcomes': ('data/story', chapter_outcomes),
        'narrative-interactions': ('data/story/interactions.json', interaction_ids),
    })
    return result, defaults


def candidate_sites(path):
    names = r'\b(showScreen|openModal|closeModal|_registerAppDialog|showModal)\??\.?\s*\('
    for number, line in enumerate((ROOT / path).read_text(encoding='utf-8').splitlines(), 1):
        if line.lstrip().startswith(('//', '*')):
            continue
        for match in re.finditer(names, line):
            if re.search(r'\bfunction\s*$', line[:match.start()]):
                continue
            literal = re.match(r"\s*['\"]([^'\"]+)['\"]\s*[,)]", line[match.end():])
            yield {'path': path, 'line': number, 'hook': match.group(1),
                   'literal': literal.group(1) if literal else None}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--trace', action='append', type=Path, default=[], help='Optional player-playtest coverage.json')
    parser.add_argument('--scope', metavar='NAME', help='Expand a named scope or feature id. Use all for every feature.')
    parser.add_argument('--json', action='store_true', help='Emit the selected scope as JSON with controls and case IDs')
    parser.add_argument('--check', action='store_true', help='Report drift and fail if inventory coverage is incomplete')
    args = parser.parse_args()
    tracked = sorted(path for path in set(git('ls-files', '--cached', '--others', '--exclude-standard', '-z').split('\0'))
                     if path and (ROOT / path).is_file())
    responsibilities = defaultdict(list)
    unassigned = []
    for path in tracked:
        group = ROOT_OWNERS.get(path) or DIRECTORY_OWNERS.get(path.split('/', 1)[0])
        if group:
            responsibilities[group].append(path)
        else:
            unassigned.append(path)

    manifest = read_json('offline-assets.json')
    package = {unquote(entry['u']) for entry in manifest['files']}
    source = (ROOT / 'battle.html').read_text(encoding='utf-8')
    surfaces = Surfaces()
    surfaces.feed(source)
    surfaces.close()
    ids = Counter(row['id'] for row in surfaces.entries)
    with REGISTER.open(encoding='utf-8', newline='') as handle:
        rows = list(csv.DictReader(handle))
    case_ids = Counter(row['case_id'] for row in rows)
    catalogs, scope_catalogs = inspect_catalogs(source, surfaces.entries, rows)
    try:
        game = build_scope(ROOT, source, surfaces.entries, scope_catalogs, rows, args.scope or 'all')
    except ValueError as error:
        parser.error(str(error))

    observed_surfaces = set()
    observed_dynamic = set()
    for path in args.trace:
        trace = json.loads(path.read_text(encoding='utf-8'))
        observed_surfaces.update(row['id'] for row in trace['inventory'] if row['evidence'])
        observed_dynamic.update(trace['dynamic'])
    traced_sources = sorted({*ROOT_GROUPS['app and shared views'].split(), 'competitive/arena.js',
                             'data/story/adventure.js', 'online-pvp.js'} -
                            {'game-upgrades.css', 'home-menu.css', 'world-location.css', 'story-activities.css'})
    call_sites = [site for path in traced_sources for site in candidate_sites(path)]
    issues = {
        'feature_scope': game['problems'],
        'unassigned_paths': unassigned,
        'manifest_paths_outside_git': sorted(package - set(tracked)),
        'duplicate_surface_ids': sorted(key for key, count in ids.items() if count > 1),
        'duplicate_case_ids': sorted(key for key, count in case_ids.items() if count > 1),
        'missing_existing_check_files': sorted({row['existing_check'] for row in rows
                                                if row['existing_check'] and not (ROOT / row['existing_check']).is_file()}),
        'catalog_drift': sorted(name for name, item in catalogs.items() if item['missing'] or item['stale']),
    }
    report = {
        'commit': git('rev-parse', 'HEAD').strip(),
        'manifest': {key: manifest[key] for key in ('version', 'digest', 'fileCount')},
        'tracked_path_count': len(tracked), 'source_groups': dict(sorted(responsibilities.items())),
        'register': {'total': len(rows), 'statuses': Counter(row['status'] for row in rows),
                     'lanes': Counter(row['lane'] for row in rows), 'catalogs': catalogs},
        'static_surfaces': surfaces.entries, 'possible_dynamic_call_sites': call_sites,
        'trace_inputs': [str(path) for path in args.trace], 'observed_static_surfaces': sorted(observed_surfaces & ids.keys()),
        'observed_extra_labels': sorted(observed_dynamic), 'issues': issues,
        'game_reference': {key: game[key] for key in ('featureCount', 'viewCount', 'catalogCounts')},
    }
    if len(package) != manifest['fileCount'] or len(package) != len(manifest['files']):
        issues['manifest_path_count_mismatch'] = True
    if args.check:
        print(f"Game inventory checked {game['featureCount']} feature families, {game['viewCount']} fixed views, "
              f"{len(game['catalogCounts'])} source catalogs and {len(rows)} playtest records.")
        for name, values in issues.items():
            for value in values if isinstance(values, list) else ([values] if values else []):
                print(f'{name}: {value}')
    elif args.scope:
        print(json.dumps({**game, 'issues': issues}, ensure_ascii=False, indent=2) if args.json else render_scope(game, issues))
    else:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    return int(any(issues.values()))


if __name__ == '__main__':
    raise SystemExit(main())
