"""Source-backed feature and scope indexes for the interface coverage audit."""

from collections import defaultdict
from html.parser import HTMLParser
import json
import re
from urllib.parse import parse_qs, urlsplit


def classic_view_kind(attrs, tag):
    classes = set((attrs.get('class') or '').split())
    if 'screen' in classes:
        return 'screen'
    if 'modal' in classes or tag == 'dialog' or attrs.get('role') in {'dialog', 'alertdialog'}:
        return 'modal'
    return None


class DocumentControls(HTMLParser):
    """Record static IDs and controls with their closest owning screen or dialog."""

    VOID = set('area base br col embed hr img input link meta param source track wbr'.split())
    CONTROL = {'a', 'button', 'input', 'select', 'summary', 'textarea'}

    def __init__(self, path, control_groups):
        super().__init__()
        self.path = path
        self.stack = []
        self.ids = {}
        self.controls = defaultdict(list)
        self.entries = {}
        self.formats = {}
        self.control_groups = control_groups
        self.group_controls = defaultdict(list)

    def handle_starttag(self, tag, pairs):
        self._start(tag, dict(pairs), tag not in self.VOID)

    def handle_startendtag(self, tag, pairs):
        self._start(tag, dict(pairs), False)

    def _start(self, tag, attrs, push):
        owner = self.stack[-1][1] if self.stack else None
        control = self.stack[-1][3] if self.stack else None
        identity = attrs.get('id')
        line = self.getpos()[0]
        if identity:
            self.ids[identity] = {'line': line, 'tag': tag}
        if self.path == 'battle.html' and identity and classic_view_kind(attrs, tag):
            owner = f'{self.path}#{identity}'
        elif self.path == 'index.html' and tag == 'main':
            owner = 'index.html#title'
        elif self.path == 'competitive/index.html' and (identity in {'setup', 'match'} or tag == 'dialog'):
            owner = f'{self.path}#{identity}'
        if tag in self.CONTROL or attrs.get('role') in {'button', 'tab', 'radio', 'switch'}:
            attributes = ('id', 'aria-label', 'name', 'href', 'type', 'title', 'onclick',
                          'onchange', 'value', 'checked', 'data-action-key', 'data-preset', 'aria-controls')
            control = {'line': line, 'tag': tag, **{key: attrs[key] for key in attributes if key in attrs}}
            self.controls[owner or self.path].append(control)
            for _, _, ancestor, _ in self.stack:
                if ancestor in self.control_groups:
                    self.group_controls[ancestor].append(control)
        if tag == 'option' and control is not None and control.get('tag') == 'select':
            option = {key: attrs[key] for key in ('value', 'disabled', 'selected') if key in attrs}
            control.setdefault('options', []).append(option)
            control = option
        if tag in {'script', 'style'} or attrs.get('aria-hidden') == 'true':
            control = None
        if tag == 'a' and attrs.get('href'):
            url = urlsplit(attrs['href'])
            if url.path == 'battle.html':
                for entry in parse_qs(url.query).get('entry', []):
                    self.entries[entry] = {'line': line}
        if tag == 'option' and self.stack and self.stack[-1][2] == 'format' and attrs.get('value'):
            self.formats[attrs['value']] = {'line': line}
        if push:
            self.stack.append((tag, owner, identity, control))

    def handle_data(self, data):
        control = self.stack[-1][3] if self.stack else None
        if control is None:
            return
        words = ' '.join(data.split())
        if words:
            control['text'] = ' '.join(filter(None, (control.get('text'), words)))

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index][0] == tag:
                del self.stack[index:]
                break


def named_catalogs(root, classic, documents, existing):
    def read(path):
        return (root / path).read_text(encoding='utf-8')

    def data(path):
        return json.loads(read(path))

    block = source_block

    def entries(keys):
        return {key: {} for key in keys}

    def matches(pattern, source):
        return entries(re.findall(pattern, source, re.M))

    def scene_profiles(group):
        source = read('world-presentation.js')
        return matches(r"^\s*scene\('([^']+)'", block(source, f'const {group} = [', '\n    ];'))

    def literal_list(name):
        start = re.search(rf'\bconst {re.escape(name)}\s*=\s*\[', classic)
        if not start:
            raise ValueError(f'Could not locate catalogue list {name}')
        return matches(r"'([^']+)'", block(classic[start.start():], start[0], '];'))

    timeline = block(classic, 'const STORY_EVENTS_RAW = [', '\n        ];')
    city_rows = re.findall(r"\[(\d+),'City','(City\d+)',null,0,\[([^\]]*)\]\]", timeline)
    if len(city_rows) != sum(1 for line in timeline.splitlines() if re.match(r"\s*\[\d+,'City'", line)):
        raise ValueError('Could not reconcile the authored City action arrays')
    city_actions = defaultdict(list)
    for row, city, actions in city_rows:
        for action in re.findall(r"'([^']+)'", actions):
            city_actions[action].append({'row': int(row), 'city': city})

    catalogs = {
        name: {'source': origin, 'entries': entries(ids)}
        for name, (origin, ids) in existing.items()
    }

    def catalog(name, origin, content):
        catalogs[name] = {'source': origin, 'entries': content}

    debuts = block(classic, 'const FACILITY_DEBUT_CITY = {', '\n        };')
    catalog('facility-debuts', 'battle.html', {
        facility: {'debutCity': int(city)} for facility, city in
        re.findall(r'\b(\w+):\s*(\d+)', '\n'.join(line.split('//', 1)[0] for line in debuts.splitlines()))
    })
    catalog('city-action-labels', 'battle.html', {name: {'authoredRows': rows} for name, rows in city_actions.items()})
    city_render = block(classic, 'function renderCityActions(ev) {', '\n        function storyFacilityIconHtml(')
    city_buttons = defaultdict(set)
    tile_calls = re.findall(
        r"""makeActionBtn\([^\n]*?,\s*['"]([\w-]+)['"]\s*,\s*([^\n]+?)\s*,\s*['"][\w-]+['"]""",
        city_render,
    )
    if len(tile_calls) != len(re.findall(r'\bmakeActionBtn\(', city_render)):
        raise ValueError('Could not reconcile the live city action buttons')
    for key, callback in tile_calls:
        if re.fullmatch(r'\w+', callback):
            declaration = re.search(rf'\bconst {re.escape(callback)}\s*=([^;]+);', city_render)
            callback = declaration[1] if declaration else callback
        actions = re.findall(r'window\.StoryMode\.(\w+)\(', callback)
        city_buttons[key].update(actions or [callback])
    catalog('city-live-actions', 'battle.html', {key: {'actions': sorted(actions)} for key, actions in city_buttons.items()})
    crucible_render = block(classic, 'function _renderCrucible() {', '\n        function _crucibleBattleSetup(')
    catalog('crucible-actions', 'battle.html', matches(r'window\.StoryMode\.(\w+)\(', crucible_render))
    arrivals = block(classic, 'const CITY_ARRIVAL_GUIDES = [', '\n        ];')
    catalog('town-arrival-guides', 'battle.html', {
        str(city): {'speaker': speaker, 'sprite': sprite}
        for city, (speaker, sprite) in enumerate(re.findall(r"\['([^']+)', '([^']+)'\]", arrivals))
    })
    landmarks = block(classic, 'const TOWN_LANDMARKS = [', '\n        ];')
    catalog('town-landmarks', 'battle.html', {
        str(city): {'name': name} for city, name in enumerate(re.findall(r"'([^']+)'", landmarks))
    })
    trainer_definitions = block(classic, 'const TRAINER_DATA = [', '\n        ];')
    trainer_rows = defaultdict(list)
    for role, name, types, row in re.findall(
        r"""{\s*role:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"],\s*type:\s*['"]([^'"]+)['"]([^}]+)}""",
        trainer_definitions,
    ):
        generation = re.search(r'\bcharGen:\s*(\d+)', row)
        sprite = re.search(r"""\bspriteFile:\s*['"]([^'"]+)['"]""", row)
        trainer_rows[f'{role}:{name}'].append({
            'type': types, 'characterGeneration': int(generation[1]) if generation else None,
            'sprite': sprite[1] if sprite else None,
        })
    if sum(map(len, trainer_rows.values())) != len(re.findall(r'^\s*{\s*role:', trainer_definitions, re.M)):
        raise ValueError('Could not reconcile trainer roster definitions')
    catalog('trainer-roster', 'battle.html', {name: {'variants': rows} for name, rows in trainer_rows.items()})
    catalog('timeline-rows', 'battle.html', {
        row: {'type': kind, 'label': label} for row, kind, label in
        re.findall(r"^\s*\[(\d+),'([^']+)','([^']+)'", timeline, re.M)
    })
    for name, group in [('town-scenes', 'cities'), ('road-scenes', 'roads'), ('facility-scenes', 'facilities')]:
        catalog(name, 'world-presentation.js', scene_profiles(group))
    catalog('entry-handlers', 'battle.html', matches(r'^\s*(\w+): \(\) =>',
            block(classic, 'const entries = {', '\n            };')))
    catalog('title-links', 'index.html', documents['index.html'].entries)
    catalog('app-title-ids', 'index.html', documents['index.html'].ids)
    catalog('arena-controls', 'competitive/index.html', documents['competitive/index.html'].ids)
    catalog('arena-formats', 'competitive/index.html', documents['competitive/index.html'].formats)
    pockets = block(classic, 'const _cityBagPockets = [', '];')
    catalog('bag-pockets', 'battle.html', {
        key: {'label': label} for key, label in re.findall(r"\['([^']+)', '([^']+)'\]", pockets)
    })
    notebook = read('game-upgrades.js')
    service_directory = block(notebook, 'const SERVICES = [', '\n  ];')
    catalog('notebook-directory', 'game-upgrades.js', {
        key: {'label': label, 'purpose': purpose} for key, label, purpose in
        re.findall(r"^\s*\['([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\]", service_directory, re.M)
    })
    lessons = block(notebook, 'const LESSONS = [', '\n  ];')
    catalog('practice-lessons', 'game-upgrades.js', matches(r"^\s*{ title:'([^']+)'", lessons))
    notebook_pages = block(notebook, 'for (const [id,label] of [', '])')
    catalog('notebook-pages', 'game-upgrades.js', {
        key: {'label': label} for key, label in re.findall(r"\['([^']+)'\s*,\s*'([^']+)'\]", notebook_pages)
    })
    summary = block(classic, '<div class="sum-tabs"', '</div>')
    catalog('summary-tabs', 'battle.html', {
        key: {'label': label} for key, label in re.findall(r'id="(sum-tab-\d+)"[^>]*>([^<]+)</button>', summary)
    })
    catalog('runtime-scenes', 'battle.html', matches(r'^\s*"((?:main|villain|extra)\.[^"]+)":\s*\{',
            block(classic, 'const STORY_SCENES = {', '\n        };')))
    for name, key in [('faction-tracks', 'VILLAIN_TRACKS'), ('anomaly-tracks', 'EXTRA_TRACKS'),
                      ('collection-tabs', '_COLLECTION_TAB_ORDER')]:
        catalog(name, 'battle.html', literal_list(key))
    catalog('camp-inputs', 'battle.html', matches(r'^\s*(\w+):\s*\(',
            block(classic, 'const _CAMP_PRIMITIVES = {', '\n        };')))
    catalog('audio-scenes', 'battle.html', {
        f'{profile}:{name}': {} for profile, key in
        [('short', 'BACKGROUND_TRACKS'), ('full', 'FULL_BACKGROUND_TRACKS')]
        for name in literal_list(key)
    })
    campaign = data('data/story/campaign.json')
    catalog('roads', 'data/story/campaign.json', entries(campaign['roads']))
    chapter_paths = [f'data/story/adventure-{key}.json' for key in ('opening', 'early', 'middle', 'finale')]
    catalog('chapters', 'data/story/campaign.json', {
        chapter['id']: {'title': chapter['title'], 'city': chapter['city'], 'data': path}
        for path in chapter_paths for chapter in data(path)
    })
    shop = 'data/story/shops.json'
    catalog('shop-stock', shop, {
        f'{shelf}.{item["id"]}': {'name': item['name'], 'price': item['price']}
        for shelf, stock in data(shop).items() if isinstance(stock, list) for item in stock
    })
    ball = 'data/story/ball-math.json'
    catalog('ball-rules', ball, {
        f'{key}.{subkey}': {'value': value} for key, values in data(ball).items() if isinstance(values, dict)
        for subkey, value in values.items()
    })
    catalog('frontier-challenges', 'data/story/frontier-challenges.js', matches(
        r"id:\s*'(frontier-[a-z]+)'", read('data/story/frontier-challenges.js')))
    catalog('framing', 'data/story/framing.json', {
        f'{row["sceneKey"]}.{row["phase"]}:{index}': {'speaker': row.get('speaker'), 'hasChoice': bool(row.get('choice'))}
        for index, row in enumerate(data('data/story/framing.json')['inject'], 1)
    })
    dialogue = {}
    for path in sorted((root / 'data/dialogue').glob('*.json')):
        source = str(path.relative_to(root))
        rows = data(source)
        pairs = enumerate(rows, 1) if isinstance(rows, list) else rows.items()
        for key, value in pairs:
            if str(key).startswith('_'):
                continue
            dialogue[f'{path.stem}:{key}'] = {'file': source, 'entries': len(value) if isinstance(value, (list, dict)) else 1}
    catalog('named-dialogue', 'data/dialogue', dialogue)
    archetypes = 'data/build-archetypes.json'
    catalog('rules-archetypes', archetypes, entries(item['id'] for item in data(archetypes)['archetypes']))
    utility = 'data/competitive-moves.json'
    catalog('rules-utility', utility, entries(data(utility)['moves']))
    catalog('release-packs', 'sw.js', matches(r"\b(?:profile ===|PACK_PROFILES\.has\()\s*'(compact|full)'", read('sw.js')))
    documentation = [*root.glob('*.md'), root / 'tests/README.md']
    documentation.extend(
        path for directory in ('docs', 'design') for path in (root / directory).rglob('*')
        if path.is_file() and path.name != '.DS_Store'
    )
    catalog('design-documents', 'docs', {
        path.relative_to(root).as_posix(): {'format': path.suffix.lstrip('.')} for path in sorted(documentation)
    })
    return catalogs


def build_scope(root, source, surfaces, defaults, register, scope):
    reference = json.loads((root / 'docs/game-reference/scopes.json').read_text(encoding='utf-8'))
    control_groups = defaultdict(set)
    for feature in reference['features']:
        for group in feature.get('controlGroups', []):
            file, identity = group.split('#', 1)
            control_groups[file].add(identity)
    documents = {}
    for path in ('battle.html', 'index.html', 'competitive/index.html'):
        parser = DocumentControls(path, control_groups[path])
        parser.feed(source if path == 'battle.html' else (root / path).read_text(encoding='utf-8'))
        parser.close()
        documents[path] = parser

    known_views = {f'battle.html#{row["id"]}': row['line'] for row in surfaces}
    title_controls = documents['index.html'].controls
    if 'index.html#title' in title_controls:
        known_views['index.html#title'] = title_controls['index.html#title'][0]['line']
    arena = documents['competitive/index.html']
    for identity, value in arena.ids.items():
        if identity in {'setup', 'match'} or value['tag'] == 'dialog':
            known_views[f'competitive/index.html#{identity}'] = value['line']

    catalogs = named_catalogs(root, source, documents, defaults)
    owners = defaultdict(list)
    owned_keys = defaultdict(set)
    problems = []
    features = reference['features']
    feature_ids = [feature['id'] for feature in features]
    scopes = reference['scopes']
    if scope != 'all' and scope not in scopes and scope not in feature_ids:
        raise ValueError(f'Unknown inventory scope {scope}. Use all, a feature id, or {", ".join(scopes)}.')
    if len(feature_ids) != len(set(feature_ids)):
        problems.append('Duplicate feature ids in scopes.json')
    if catalogs['title-links']['entries'].keys() - catalogs['entry-handlers']['entries'].keys():
        problems.append('Public title links without a Classic entry handler')
    if catalogs['runtime-scenes']['entries'].keys() != set().union(*(
        catalogs[name]['entries'].keys() for name in ('main-scenes', 'faction-scenes', 'anomaly-scenes')
    )):
        problems.append('Runtime scenes differ from the narrative revision catalog')

    workstreams = defaultdict(list)
    for row in register:
        if row['status'] != 'retired':
            workstreams[row['workstream']].append(row['case_id'])
    active_case_ids = {case_id for case_ids in workstreams.values() for case_id in case_ids}

    def view_details(view):
        file, identity = view.split('#', 1)
        return {'id': identity, 'file': file, 'line': known_views[view],
                'staticControls': documents[file].controls[view]}

    selected = []
    for feature in features:
        key = feature['id']
        for tag in feature['scopes']:
            if tag not in scopes:
                problems.append(f'{key} has an unknown scope {tag}')
        for path in [f'docs/game-reference/{feature["guide"]}', *feature['checks']]:
            if not (root / path).is_file():
                problems.append(f'{key} refers to a missing file {path}')
        related = []
        for view in feature.get('relatedViews', []):
            if view not in known_views:
                problems.append(f'{key} refers to an unknown related view {view}')
            else:
                related.append(view_details(view))
        groups = []
        for group in feature.get('controlGroups', []):
            file, identity = group.split('#', 1)
            if file not in documents or identity not in documents[file].ids:
                problems.append(f'{key} refers to an unknown control group {group}')
                continue
            document = documents[file]
            groups.append({'file': file, 'id': identity, 'line': document.ids[identity]['line'],
                           'staticControls': document.group_controls[identity]})
        views = []
        for view in feature['views']:
            owners[view].append(key)
            if view not in known_views:
                problems.append(f'{key} refers to an unknown view {view}')
                continue
            views.append(view_details(view))
        covered = {}
        for name, keys in feature['catalogs'].items():
            if name not in catalogs:
                problems.append(f'{key} refers to an unknown catalog {name}')
                continue
            records = catalogs[name]['entries']
            selected_keys = set(records) if keys == '*' else set(keys)
            if stale := sorted(selected_keys - records.keys()):
                problems.append(f'{key} has stale {name} entries {", ".join(stale)}')
            owned_keys[name].update(selected_keys)
            covered[name] = {'source': catalogs[name]['source'],
                             'entries': {entry: records[entry] for entry in sorted(selected_keys & records.keys())}}
        case_ids = set(feature.get('cases', []))
        if stale := sorted(case_ids - active_case_ids):
            problems.append(f'{key} refers to unknown playtest cases {", ".join(stale)}')
        for stream in feature['register']:
            if stream not in workstreams:
                problems.append(f'{key} has no active cases in {stream}')
            case_ids.update(workstreams[stream])
        if scope == 'all' or scope == key or scope in feature['scopes']:
            selected.append({**feature, 'views': views, 'relatedViews': related, 'controlGroups': groups,
                             'catalogs': covered, 'caseIds': sorted(case_ids)})

    for view in sorted(known_views):
        if len(owners[view]) != 1:
            problems.append(f'{view} requires one inventory owner, found {len(owners[view])}')
    for name, catalog in catalogs.items():
        if not catalog['entries']:
            problems.append(f'Source catalog {name} is empty')
        if missing := sorted(catalog['entries'].keys() - owned_keys[name]):
            problems.append(f'Unassigned {name} entries {", ".join(missing)}')

    return {
        'scope': scope, 'scopes': scopes, 'featureCount': len(features), 'viewCount': len(known_views),
        'catalogCounts': {key: len(value['entries']) for key, value in sorted(catalogs.items())},
        'features': selected, 'problems': sorted(set(problems)),
    }


def source_block(source, marker, end):
    _, found, body = source.partition(marker)
    value, closed, _ = body.partition(end)
    if not found or not closed:
        raise ValueError(f'Could not locate catalog {marker}')
    return value


def render_scope(game, issues):
    scope = game['scope']
    parts = [f'# Game scope · {scope}', '',
             game['scopes'].get(scope, 'Resolve the selected feature from the current source.'), '',
             'The links identify source and candidate checks. Seeing a check in this inventory does not record a run.', '']
    for feature in game['features']:
        parts.extend([f'## {feature["title"]}', '',
                      f'`{feature["id"]}` · [Feature guide](docs/game-reference/{feature["guide"]})', ''])
        for view in feature['views']:
            parts.append(f'- `{view["id"]}` owns {len(view["staticControls"])} static controls. '
                         f'[{view["file"]}]({view["file"]}#L{view["line"]})')
        for group in feature['controlGroups']:
            parts.append(f'- `{group["id"]}` contains {len(group["staticControls"])} controls. '
                         f'[{group["file"]}]({group["file"]}#L{group["line"]})')
        for view in feature['relatedViews']:
            parts.append(f'- Also reached through `{view["id"]}`. [{view["file"]}]({view["file"]}#L{view["line"]})')
        for name, value in feature['catalogs'].items():
            keys = ', '.join(f'`{key}`' for key in list(value['entries'])[:18])
            remaining = len(value['entries']) - 18
            if remaining > 0:
                keys += f', plus {remaining} more in the JSON output'
            parts.append(f'- {name} ({len(value["entries"])}). {keys}. [{value["source"]}]({value["source"]})')
        for check in feature['checks']:
            parts.append(f'- Check with [{check}]({check}).')
        if feature['caseIds']:
            parts.append(f'- {len(feature["caseIds"])} attached cases in the coverage register. '
                         '[Playtest register](docs/PLAYTEST_COVERAGE_REGISTER.csv)')
        parts.append('')
    if any(issues.values()):
        parts.extend(['## Inventory findings', ''])
        for group, entries in issues.items():
            for entry in entries if isinstance(entries, list) else ([entries] if entries else []):
                parts.append(f'- {group}. {entry}')
    return '\n'.join(parts)
