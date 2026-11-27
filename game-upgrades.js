/* Player-facing tools built on StoryMode's deterministic product interface. */
(function (global) {
  'use strict';
  const VERSION = global.document.querySelector('meta[name="battle-version"]')?.content || 'Unknown';
  const RULESET = 'story-singles-2026-09';
  const { storyKey: SAVE, settingsKey: SETTINGS, accessibilityKey: PREFS } = global.GameStorage;
  const META = 'pbs_story_meta';
  const RESTORE_JOURNAL = 'pbs_restore_pending';
  const SLOT_KEYS = ['pbs_slot_1', 'pbs_slot_2', 'pbs_slot_3'];
  const KEYS = [SAVE, META, SETTINGS, PREFS];
  const PORTABLE_KEYS = [...KEYS, ...SLOT_KEYS];
  const BACKUP_CONTENTS = {
    [SAVE]: 'Story run',
    [META]: 'collection records',
    [SETTINGS]: 'game settings',
    [PREFS]: 'accessibility preferences',
    ...Object.fromEntries(SLOT_KEYS.map((key, index) => [key, `save slot ${index + 1}`])),
  };
  const SERVICES = [
    ['mentor','Battle Mentor','Get a build recommendation'],
    ['tutor','Move Tutor','Teach moves'],
    ['dojo','Battle Dojo','Change held items and abilities'],
    ['nature','Nature Rater','Change a nature'],
    ['evolab','Evolution Tutor','Evolve a partner'],
    ['evtrainer','EV Trainer','Adjust battle training'],
    ['fanclub','Pokémon Fan Club','Raise IVs with vitamins'],
    ['center','Pokémon Center','Manage your party and PC'],
    ['stoneShop','Stones and Beyond','Buy evolution items'],
    ['link','Cable Link','Trade or rebuild a partner'],
    ['colress','Colress','Assign a battle form'],
    ['mart','Pokémart','Buy balls and battle supplies'],
    ['dept','Department Store','Buy balls and rare gear'],
    ['relic','Relics','Change battle rules'],
    ['casino','Poké Game Corner','Play coin flip, slots or roulette'],
    ['safari','Safari Zone','Catch wild Pokémon'],
    ['daycare','Daycare Inn','Visit the matron about Eggs'],
  ];
  const LESSONS = [
    { title:'Type matchups', prompt:'A Water-type attack faces a Rock/Ground opponent. What happens?', choices:['It is resisted','It is four times effective','It has no effect'], answer:1, explanation:'Water is strong against both Rock and Ground. The two type multipliers combine: 2 × 2 = 4. An ability or other effect can still change the result.' },
    { title:'Switch with a purpose', prompt:'Your active Pokémon is weak to the opponent’s revealed Electric attack. Which switch has a natural type immunity?', choices:['A Ground-type partner','A Water-type partner','A Flying-type partner'], answer:0, explanation:'Ground is naturally immune to Electric attacks. Consider the opponent’s other revealed moves before switching; a good defensive switch is more than one favorable type.' },
    { title:'Priority and speed', prompt:'One Pokémon uses Quick Attack and the other uses an ordinary priority-zero attack. With no other effects, which acts first?', choices:['Always the faster Pokémon','Quick Attack','Always the slower Pokémon'], answer:1, explanation:'Move priority is checked before Speed. Quick Attack has increased priority. Within the same priority bracket, Speed normally decides the order.' },
    { title:'Damage categories', prompt:'You want to improve Flamethrower’s damage. Which trained attacking stat normally matters?', choices:['Attack','Defense','Special Attack'], answer:2, explanation:'Flamethrower is a special move. Special Attack determines its attacking strength. Physical moves usually use Attack, with specific exceptions such as Body Press.' },
    { title:'Held-item tradeoffs', prompt:'What does Choice Scarf normally trade for its Speed boost?', choices:['You cannot switch out','You are locked into one move until switching','All attacks lose accuracy'], answer:1, explanation:'Choice Scarf increases Speed but restricts move choice until the Pokémon switches. Plan an escape route instead of treating it as a free boost.' },
    { title:'Setup and counterplay', prompt:'An opponent has raised its Attack twice. What is a useful response to consider?', choices:['Keep giving it free setup turns','Use an available reset, burn, defensive switch or faster threat','Use any move of the same type'], answer:1, explanation:'Choose a response your team actually has. Setup is powerful when unchecked; status, stat resets, switching and immediate pressure can interrupt the plan.' },
    { title:'Unaware', prompt:'What does a defending Pokémon’s Unaware ignore during an ordinary incoming attack?', choices:['The attacker’s relevant stat stages, including drops','All held items','Type effectiveness'], answer:0, explanation:'Unaware ignores relevant stat-stage changes. It does not erase held-item effects, type matchups or the underlying trained stats. Ability-bypassing effects can change this interaction.' },
    { title:'Build a team plan', prompt:'Every team member uses the same coverage and needs several setup turns. What should you investigate first?', choices:['Whether the team has safe switch-ins and an immediate threat','Making all six movesets identical','Buying every expensive upgrade'], answer:0, explanation:'A team needs a workable route to victory. Complementary partners can cover each other’s weaknesses; the most expensive individual sets may still fit poorly together.' },
  ];

  let overlay = null, panel = null, releaseDialog = null, dismiss = null;
  const api = () => global.StoryMode && global.StoryMode.upgrades;
  const element = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text != null) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  const append = (parent, ...nodes) => { nodes.filter(Boolean).forEach(n => parent.appendChild(n)); return parent; };
  function button(label, action, primary = false) {
    const b = element('button', label, primary ? 'upgrade-primary' : '');
    b.type = 'button'; b.addEventListener('click', action); return b;
  }
  function card(title, text) {
    return append(element('section', null, 'upgrade-card'), element('h3', title), text ? element('p', text) : null);
  }
  function close() {
    if (!overlay) return;
    for (const dialog of overlay.querySelectorAll('.modal:not(.hidden)')) global.closeModal(dialog.id);
    overlay.remove();
    overlay = panel = null;
    releaseDialog();
    releaseDialog = dismiss = null;
  }
  function open(title) {
    if (!overlay) {
      overlay = element('div', null, 'upgrade-overlay');
      panel = element('div', null, 'upgrade-dialog');
      panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true');
      panel.setAttribute('aria-labelledby', 'upgrade-title'); panel.tabIndex = -1;
      overlay.appendChild(panel); document.body.appendChild(overlay);
      releaseDialog = global._registerAppDialog(panel, () => dismiss());
      overlay.addEventListener('click', e => { if (e.target === overlay) dismiss(); });
    }
    dismiss = close;
    panel.className = 'upgrade-dialog';
    panel.replaceChildren();
    const heading = element('h2', title); heading.id = 'upgrade-title';
    append(panel, append(element('header', null, 'upgrade-header'), heading, button('Close', () => dismiss())));
    panel.focus(); return panel;
  }
  function notice(text) { const n = element('p', text, 'upgrade-feedback'); n.setAttribute('role','status'); panel.appendChild(n); return n; }
  function read(key, fallback = null) {
    try { const raw = global.localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (_) { return fallback; }
  }
  function currentRun(stored = read(SAVE)) {
    const state = global.StoryMode?.state;
    return state?.active && !global.__storyRestoreReady ? state : stored;
  }
  function displayDate(value) {
    if (typeof value !== 'string' && typeof value !== 'number') return '';
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toLocaleString() : '';
  }
  function activeBattle() { return !!(api() && api().battleActive()); }
  function restoreBlockedReason() {
    if (activeBattle()) return 'Finish the battle before restoring a backup.';
    if (document.getElementById('screen-draft')?.classList.contains('hidden') === false
        || global.OnlineBattle?.isActive?.()) return 'Exit the draft or online room before restoring a backup.';
    return '';
  }

  function analyzeTeam(team, effectiveness) {
    const notes = [];
    if (!team.length) return ['Choose your first partner, then revisit this page.'];
    if (team.length === 1) return ['You have one battle-ready partner. Check which of their equipped moves can hit the opponent, and use your Bag if battle items are available.'];
    const types = ['Normal','Fire','Water','Electric','Grass','Ice','Fighting','Poison','Ground','Flying','Psychic','Bug','Rock','Ghost','Dragon','Dark','Steel','Fairy'];
    for (const type of types) {
      const weak = team.filter(m => effectiveness(type,m.types) > 1);
      const safe = team.filter(m => effectiveness(type,m.types) < 1);
      if (weak.length >= 2 && safe.length === 0) notes.push(`${weak.length} partners share a ${type} weakness, with no natural resistance in the party. Check abilities and a possible switch-in.`);
    }
    const physical = team.some(m => m.moves.some(v => v.category === 'Physical'));
    const special = team.some(m => m.moves.some(v => v.category === 'Special'));
    if (team.length >= 3 && !physical && !special) notes.push('Your party has no damaging moves. Check whether its support moves form a workable win condition.');
    else if (team.length >= 3 && (!physical || !special)) notes.push(`All of your damaging moves use ${physical ? 'Attack' : 'Special Attack'}. A different damage category may help against specialized walls.`);
    const names = new Set(team.flatMap(m => m.moves.map(v => v.name)));
    if (team.length >= 4 && !['Tailwind','Thunder Wave','Icy Wind','Trick Room','Sticky Web','Electroweb'].some(m => names.has(m))) notes.push('No common speed-control move is equipped. Consider whether your team wins through natural Speed, priority, bulk, or a control move.');
    if (!notes.length) notes.push('No obvious structural gap was found by this basic check. Matchups, abilities, items and your intended strategy still matter.');
    return notes.slice(0,5);
  }

  function openNotebook(tab = 'next', focusTab = false) {
    const showRules = tab === 'rules';
    if (showRules) tab = 'team';
    if (!['next','team','story'].includes(tab)) tab = 'next';
    const p = open('Trainer’s Notebook');
    if (!api()) return notice('Game data is still loading. Close this page and try again shortly.');
    p.classList.add('upgrade-dialog--notebook');
    const s = api().snapshot();
    const nav = element('nav',null,'upgrade-tabs'); nav.setAttribute('aria-label','Notebook pages');
    for (const [id,label] of [['next','What next?'],['team','My team'],['story','Journal']]) {
      const b = button(label,()=>openNotebook(id,true)); if (tab === id) b.setAttribute('aria-current','page'); nav.appendChild(b);
    }
    append(p,nav);
    if (focusTab) nav.querySelector('[aria-current="page"]').focus();
    if (tab === 'next') {
      const objective = card(s.active ? s.goal : 'Begin your adventure');
      objective.classList.add('upgrade-objective');
      const nextAction = document.querySelector('#screen-story-city:not(.hidden) #story-city-primary .story-city-objective');
      if (nextAction) append(objective,button('Go to my next action',()=>{
        close();
        nextAction.click();
      },true));
      append(p,objective);
      if (s.errand) append(p,card('Current errand',s.errand));
      else if (s.discoveryHints?.length) append(p,card('Heard in town',s.discoveryHints.at(-1)));
      const shortcuts = element('div',null,'upgrade-notebook-shortcuts');
      if (s.active && global.StoryMode?.openJourneyAtlas) {
        append(shortcuts,button('Journey Atlas',()=>{
          close();
          global.StoryMode.openJourneyAtlas(()=>openNotebook('next',true));
        }));
      }
      append(p,append(shortcuts,button('Practice a battle concept',openPractice)));
      const available = new Set(s.availableFacilities);
      const guide = append(element('details'), element('summary', s.inCrucible ? 'Services at the Crucible' : 'Services in this town'));
      const list=element('ul',null,'upgrade-notebook-services');
      for (const [key,name,description] of SERVICES) {
        if (!available.has(key)) continue;
        const visit = button(name,()=>{ close(); api().visit(key); });
        visit.setAttribute('aria-label', `Visit ${name}`);
        list.appendChild(append(element('li'),visit,element('span',description)));
      }
      if (list.children.length) append(p,append(guide,list));
    } else if (tab === 'team') {
      if (s.openingRivalDefeat && s.team.length === 1) append(p,openingRivalRecovery());
      const notes = analyzeTeam(s.team,api().typeEffectiveness);
      append(p,element('p',notes[0],'upgrade-feedback'));
      if (notes.length > 1) append(p,append(element('details'),element('summary','More team advice'),...notes.slice(1).map(note=>element('p',note))));
      if(s.availableFacilities?.includes('mentor')) append(p,button('Review upgrades with the Mentor',()=>{close();api().visit('mentor');},true));
      const grid=element('div',null,'upgrade-grid');
      const favoriteButton = mon => {
        const label = marked => marked ? 'Unprotect favorite' : 'Protect as favorite';
        const control = button(label(mon.favorite), () => {
          const marked = api().favorite(mon.id);
          control.textContent = label(marked);
          control.setAttribute('aria-pressed', String(marked));
        });
        control.setAttribute('aria-pressed', String(mon.favorite));
        return control;
      };
      for (const mon of s.team) {
        const c=card(mon.nickname || mon.name,`${mon.types.join(' / ')} · Stats ${mon.statTotal} · ${mon.attackStyle}`);
        const full=append(element('details'),element('summary','Stats and moves'));
        const list=element('ul'); for(const move of mon.moves) append(list,element('li',`${move.name} (${[move.type,move.category].filter(Boolean).join(', ')})`));
        append(full,element('p',`${mon.nature} · ${mon.ability} · ${mon.item === 'None' ? 'No held item' : mon.item}`),element('p',`HP ${mon.hp} · Atk ${mon.stats.atk} · Def ${mon.stats.def} · SpA ${mon.stats.spa} · SpD ${mon.stats.spd} · Spe ${mon.stats.spe}`),list);
        append(c,full,favoriteButton(mon));
        grid.appendChild(c);
      }
      append(p,grid);
      if(s.storage?.length) {
        const storage=append(element('details'),element('summary','Protect partners in storage'));
        append(p,append(storage,append(element('div',null,'upgrade-grid'),...s.storage.map(mon=>append(card(mon.name),favoriteButton(mon))))));
      }
      const rules=append(element('details'),element('summary','Battle rules'),
        element('p',`Difficulty: ${s.difficulty}. Battles use singles rules. Partners usually fight at level 50. EXP-Share upgrades can raise this to 53.`),
        element('p','Priority comes before Speed. Nature, IVs and EVs change trained stats. Stages change those stats during a fight.'),
        button('Explain the current battle',openBattleReview),
        button('Export run passport',()=>download('battle-run-passport.json',JSON.stringify(runPassport(),null,2))));
      rules.open = showRules;
      append(p,rules);
    } else {
      const archive = document.querySelector('.screen:not(.hidden) [data-adventure-archive]');
      if (archive) append(p,button('Open the Field Archive',()=>{close();archive.click();},true));
      const journal=element('div',null,'story-journal-body'); journal.innerHTML=s.journal; append(p,journal);
    }
  }

  function openPractice(index = 0) {
    index = Number.isInteger(index) && LESSONS[index] ? index : 0;
    const p=open('Practice lessons');
    p.classList.add('upgrade-dialog--practice');
    const nav=element('label',null,'upgrade-practice-topic');
    append(nav,element('span','Topic'));
    const topics=element('select');
    LESSONS.forEach((lesson,i)=>{
      const option=element('option',lesson.title);
      option.value=String(i);
      option.selected=i===index;
      append(topics,option);
    });
    topics.addEventListener('change',()=>{
      openPractice(Number(topics.value));
      panel.querySelector('.upgrade-practice-topic select')?.focus();
    });
    append(p,append(nav,topics));
    const lesson=LESSONS[index] || LESSONS[0]; append(p,element('h3',lesson.title),element('p',lesson.prompt));
    const feedback=element('p',null,'upgrade-feedback'); feedback.hidden=true; feedback.setAttribute('role','status');
    lesson.choices.forEach((choice,i)=>append(p,button(choice,()=>{
      feedback.hidden=false; feedback.textContent=`${i===lesson.answer ? 'Correct.' : 'Try another approach.'} ${lesson.explanation}`;
    })));
    append(p,feedback,append(element('div',null,'upgrade-actions'),
      button('Next lesson',()=>openPractice((index+1)%LESSONS.length)), button('Back to Notebook',()=>openNotebook('next',true))));
  }

  function openingRivalRecovery() {
    return card('After the first Rival duel',
      'Continue the story heals your partner and keeps your gold. The rival gets the win. Retry faces the same rival team. Return to Last City gives you time to prepare.');
  }
  const COACH_STATUS = {
    brn: 'was burned', frz: 'was frozen', par: 'was paralyzed',
    psn: 'was poisoned', slp: 'fell asleep', tox: 'was badly poisoned',
  };
  const COACH_SETUP = {
    atk: 'Attack', def: 'Defense', spa: 'Special Attack', spd: 'Special Defense', spe: 'Speed',
    accuracy: 'accuracy', evasion: 'evasion', Reflect: 'Reflect', 'Light Screen': 'Light Screen',
    'Aurora Veil': 'Aurora Veil', Tailwind: 'Tailwind',
  };
  const COACH_PRIORITY = { immune: 3, 'super-effective': 2, status: 1, setup: 1 };
  function normalizeBattleObservation(value) {
    if (typeof value?.kind !== 'string' || !Object.hasOwn(COACH_PRIORITY, value.kind)) return null;
    const field = name => typeof value[name] === 'string' ? value[name].trim().slice(0, 100) : '';
    const subject = field('subject');
    if (!subject) return null;
    const { kind } = value;
    const move = field('move');
    const opponent = field('opponent');
    if (kind === 'status' || kind === 'setup') {
      const effect = field('effect');
      if (!Object.hasOwn(kind === 'status' ? COACH_STATUS : COACH_SETUP, effect)) return null;
      return { kind, subject, move, opponent, effect };
    }
    return { kind, subject, move, opponent, ability: field('ability') };
  }
  function observeBattle(events, filter = null) {
    let move = null;
    let publicTurn = null;
    let observation = null;
    let observedTurn = -1;
    for (const { native, turn } of events || []) {
      if (!native) continue;
      let current = null;
      if (native.tag === 'move') {
        move = native;
      } else if (native.tag === 'turn') {
        publicTurn = Number(native.subject) || null;
        move = null;
      } else if (['switch', 'drag', 'replace', 'cant', 'boss-phase'].includes(native.tag)) {
        move = null;
      } else if (native.tag === '-immune' && move?.side === 'p1' && native.side === 'p2'
          && (!move.targetSide || move.targetSide === 'p2') && move.detail
          && !native.detail?.startsWith('[from] move:')) {
        current = normalizeBattleObservation({
          kind: 'immune', subject: native.subject, move: move.detail, opponent: native.subject,
          ability: native.detail?.match(/^\[from\] ability: (.+)$/)?.[1],
        });
      } else if (native.tag === '-supereffective' && move?.side === 'p2' && native.side === 'p1'
          && (!move.targetSide || move.targetSide === 'p1')) {
        current = normalizeBattleObservation({
          kind: 'super-effective', subject: native.subject, move: move.detail, opponent: move.subject,
        });
      } else if (native.tag === '-status' && native.side === 'p1') {
        current = normalizeBattleObservation({ kind: 'status', subject: native.subject, effect: native.detail });
      } else if (native.tag === '-boost' && native.side === 'p2') {
        current = normalizeBattleObservation({ kind: 'setup', subject: native.subject, effect: native.detail });
      } else if (native.tag === '-sidestart' && native.side === 'p2') {
        current = normalizeBattleObservation({
          kind: 'setup', subject: 'The opposing team', effect: native.detail?.replace(/^move: /, ''),
        });
      }
      const eventTurn = publicTurn ?? turn;
      if (current && (!filter || filter(current)) &&
          (observedTurn !== eventTurn || COACH_PRIORITY[current.kind] >= COACH_PRIORITY[observation?.kind])) {
        observation = current;
        observedTurn = eventTurn;
      }
    }
    return observation;
  }
  function describeBattleObservation(observation) {
    if (!observation) return '';
    const { kind, subject, move, ability, effect } = observation;
    if (kind === 'immune') {
      return ability ? `${subject}’s ${ability} blocked ${move}.` : `${move} had no effect on ${subject}.`;
    }
    if (kind === 'status') return `${subject} ${COACH_STATUS[effect]}.`;
    if (kind === 'setup') return subject === 'The opposing team'
      ? `${COACH_SETUP[effect]} went up on the opposing side.` : `${subject} raised its ${COACH_SETUP[effect]}.`;
    return `${subject} took a super-effective hit${move ? ` from ${move}` : ''}.`;
  }
  function openBattleReview() {
    const p=open('Explain this battle');
    const events=api() ? api().events() : [];
    const run=api()?.snapshot();
    const defeat = document.getElementById('screen-story-gameover');
    const reviewingDefeat = run?.active && defeat && !defeat.classList.contains('hidden');
    const observation = reviewingDefeat ? (api()?.defeatObservation?.() || observeBattle(events)) : null;
    if (run?.openingRivalDefeat && run.team.length === 1) append(p,openingRivalRecovery());
    const native=events.filter(e=>e.native);
    const calculations=events.filter(e=>e.kind==='calculation').slice(-12);
    if (native.some(e=>e.native.kind==='move' || e.native.kind==='damage')) {
      append(p,element('h3','What happened'));
      const outcomes=element('ol');
      native.filter(e=>['move','damage','heal','faint'].includes(e.native.kind) ||
        ['-miss','-immune','-supereffective','-resisted','-crit','-status','-boost','-sidestart','cant','boss-phase'].includes(e.native.tag))
        .slice(-10).forEach(e=>append(outcomes,element('li',e.text)));
      append(p,outcomes);
    } else if (calculations.length) {
      append(p,element('p','These calculations show a direct hit before survival effects and special encounter rules. The recent log shows the final result.'));
      for(const e of calculations.slice().reverse()) {
        const critical=e.critical ? ' Critical hit.' : '';
        const weather=e.weather ? ` Weather was ${e.weather}.` : '';
        append(p,card(`Turn ${e.turn} · ${e.attacker} → ${e.defender}`,`${e.move} · ${e.category} · ${e.basePower} power. Type multiplier ×${e.effectiveness}. Same-type bonus ×${e.stab}. Calculated damage ${e.damage}.${critical}${weather}`));
      }
    } else if (!observation) {
      append(p,element('p','Battle outcomes appear here after the first attack.'));
    }
    if (observation) {
      const preparation = api()?.defeatPreparation?.(observation);
      append(p,card('One change to try',
        [describeBattleObservation(observation), preparation || 'Compare your equipped moves and party matchups before the retry.'].join(' ')));
    }
    const details=element('details'); append(details,element('summary','Recent battle log'));
    const log=element('ol'); events.filter(e=>e.kind==='message').slice(-60).forEach(e=>append(log,element('li',e.text))); append(details,log); append(p,details);
    const received=calculations.filter(e=>!e.playerAttacking && e.effectiveness>1);
    if(received.length && !observation) {
      const prep = run?.team.length > 1 ? 'Check whether an available partner can switch into that type.'
        : 'Check the recorded attacks against your equipped moves and items.';
      append(p,card('One preparation question',`Your team received ${received.length} recorded super-effective attack${received.length===1?'':'s'}. ${prep}`));
    }
    append(p,button('Review my team',()=>openNotebook('team')),button('Export a bug report',exportBugReport));
  }

  function validateRun(run) {
    if(!run || !Number.isInteger(run.version) || run.version<2 || run.version>global.GameStorage.storyVersion || !Array.isArray(run.team)) throw new Error('This run is missing required data or uses a newer save version.');
    if(!Number.isFinite(run.gold) || run.gold<0 || !Number.isInteger(run.badges) || run.badges<0 || run.badges>8) throw new Error('This run contains invalid progress values.');
    if(run.team.length>6 || (run.pcBox!==undefined && !Array.isArray(run.pcBox))) throw new Error('This run contains an invalid party.');
    for(const mon of [...run.team,...(run.pcBox || [])]) {
      if(!mon || typeof mon.name!=='string' || !mon.name.trim()) throw new Error('This run contains an invalid party.');
      if(mon.isEgg===true) continue;
      const moves=mon.build?.m;
      if(!Array.isArray(moves) || moves.length<1 || moves.length>4 || moves.some(name=>typeof name!=='string' || !name.trim())) throw new Error('This run contains an invalid party.');
    }
    if(!Number.isInteger(run.eventIndex) || run.eventIndex<0 || run.eventIndex>(api()?.maxEventIndex ?? 100)) throw new Error('This run contains an invalid journey position.');
  }
  function validateBackupEntries(backup, keys) {
    if(backup.format!=='battle-backup' || backup.version!==1 || !backup.entries || typeof backup.entries!=='object' || Array.isArray(backup.entries)) throw new Error('Unsupported backup format.');
    const entries = Object.entries(backup.entries);
    if(!entries.length) throw new Error('This backup has no game data.');
    for(const [key, data] of entries) {
      if(!keys.includes(key)) throw new Error('Backup contains unknown storage entries.');
      if(!data || typeof data!=='object' || Array.isArray(data)) throw new Error('Backup entries must be data objects.');
    }
    if(Object.hasOwn(backup.entries, SAVE)) validateRun(backup.entries[SAVE]);
  }
  function validateBackup(value) {
    if(!value || typeof value!=='object' || Array.isArray(value)) throw new Error('Choose a valid JSON backup.');
    const visit=(v,depth=0)=>{
      if(depth>60) throw new Error('Backup nesting is too deep.');
      if(v && typeof v==='object') for(const [k,x] of Object.entries(v)) {
        if(['__proto__','prototype','constructor'].includes(k)) throw new Error('Backup contains an unsafe key.');
        visit(x,depth+1);
      }
    }; visit(value);
    const backup=value.format==='battle-backup' ? value : {format:'battle-backup',version:1,entries:{[SAVE]:value}};
    validateBackupEntries(backup, PORTABLE_KEYS);
    for (const key of SLOT_KEYS) {
      const slot = backup.entries[key];
      if (!slot) continue;
      validateBackupEntries(slot, KEYS);
      if (!slot.entries[SAVE]) throw new Error('A saved slot is missing its Story run.');
    }
    return backup;
  }
  function portableSettings(value) {
    if (!value) return null;
    const settings = {...value};
    delete settings.offlineDownload;
    return Object.keys(settings).length ? settings : null;
  }
  function makeBackup(includeSlots = true) {
    const entries={};
    for(const key of includeSlots ? PORTABLE_KEYS : KEYS) {
      let value = read(key);
      if (key === SETTINGS) value = portableSettings(value);
      if (value === null) continue;
      if (SLOT_KEYS.includes(key)) {
        try { validateBackupEntries(value, KEYS); }
        catch (_) { continue; }
        if (!value.entries[SAVE]) continue;
        const slotEntries = {...value.entries};
        const settings = portableSettings(slotEntries[SETTINGS]);
        if (settings) slotEntries[SETTINGS] = settings;
        else delete slotEntries[SETTINGS];
        value = {...value, entries: slotEntries};
      }
      entries[key] = value;
    }
    // On failed persistence the in-memory run is the newest recoverable progress.
    const run = currentRun(entries[SAVE] || null);
    if (run) entries[SAVE] = JSON.parse(JSON.stringify(run));
    if (!Object.keys(entries).length) throw new Error('There is no game data to back up yet.');
    return {format:'battle-backup',version:1,game:VERSION,rules:RULESET,createdAt:new Date().toISOString(),entries};
  }
  function restoreSnapshot(entries) {
    const dependencies = new Set(Object.keys(entries));
    if (dependencies.has(SAVE)) dependencies.add(META);
    return {
      stored: Object.fromEntries([...dependencies].map(key => [key, global.localStorage.getItem(key)])),
      live: dependencies.has(SAVE) && global.StoryMode?.state.active && !global.__storyRestoreReady
        ? JSON.stringify(global.StoryMode.state) : null,
    };
  }
  class StaleRestoreReview extends Error {}
  function checkRestoreSnapshot(reviewed, latest) {
    if (reviewed.live !== latest.live || Object.keys(latest.stored).some(key => reviewed.stored[key] !== latest.stored[key])) {
      throw new StaleRestoreReview('Your local data changed. Review the current comparison before restoring.');
    }
  }
  function restoreBackup(value, reviewed = null) {
    const blocked = restoreBlockedReason();
    if (blocked) throw new Error(blocked);
    const b=validateBackup(value), previous={};
    const latest = restoreSnapshot(b.entries);
    if (reviewed) checkRestoreSnapshot(reviewed, latest);
    const entries={...b.entries};
    const localMeta = global.GameStorage.parseRecord(latest.stored[META]);
    if (entries[SETTINGS]) {
      const deviceDownload = global.GameStorage.parseRecord(latest.stored[SETTINGS]).offlineDownload;
      entries[SETTINGS] = portableSettings(entries[SETTINGS]) || {};
      if (deviceDownload) entries[SETTINGS].offlineDownload = deviceDownload;
    }
    if(global.FrontierChallenges && entries[META]) {
      entries[META]={...entries[META],frontierChallengeRecords:global.FrontierChallenges.mergeRecords(
        localMeta.frontierChallengeRecords,entries[META].frontierChallengeRecords)};
    }
    const archive=global.AdventureProgress;
    if(archive && (entries[SAVE] || entries[META])) {
      const current=archive.normalize(localMeta.adventureArchive);
      const incoming=archive.normalize(entries[META]?.adventureArchive);
      let run=entries[SAVE];
      const hasIdentity = run && archive.isRunId(run.adventureRunId) && Number.isInteger(run.runSeed);
      if (hasIdentity) {
        const id = run.adventureRunId;
        const seed = run.runSeed >>> 0;
        if (current.runs[id] && current.runs[id].seed !== seed) {
          const newId = archive.createRunId();
          if (incoming.runs[id]?.seed === seed) {
            incoming.runs[newId] = incoming.runs[id];
            delete incoming.runs[id];
          }
          run = {...run, adventureRunId: newId};
        }
      }
      const merged = archive.mergeArchives(current,incoming);
      if (hasIdentity) entries[SAVE] = {...run, storyChoices: archive.reconcileChoices(merged, run.adventureRunId, run.runSeed, run.storyChoices)};
      if (entries[META]) entries[META]={...entries[META],adventureArchive:merged};
    }
    for(const key of Object.keys(entries)) previous[key]=latest.stored[key];
    // Keep a recovery journal until every write succeeds. Never include connection tokens.
    if (global.localStorage.getItem(RESTORE_JOURNAL) !== null) {
      throw new Error('An earlier restore needs recovery. Back up your data and reload before trying again.');
    }
    checkRestoreSnapshot(latest, restoreSnapshot(b.entries));
    try {
      global.localStorage.setItem(RESTORE_JOURNAL,JSON.stringify(previous));
    } catch (_) {
      throw new Error('Storage is unavailable or too full to start restoring safely. Your current saves are still here.');
    }
    try {
      for(const [key,data] of Object.entries(entries)) global.localStorage.setItem(key,JSON.stringify(data));
      global.localStorage.removeItem(RESTORE_JOURNAL);
    } catch(error) {
      let restored=true;
      for(const [key,data] of Object.entries(previous)) {
        try { if(data===null) global.localStorage.removeItem(key); else global.localStorage.setItem(key,data); } catch(_) { restored=false; }
      }
      if(restored) {
        try { global.localStorage.removeItem(RESTORE_JOURNAL); } catch (_) { /* The journal can still be replayed. */ }
      }
      throw new Error('Restore could not complete. Your previous data was retained for recovery.');
    }
    global.__storyRestoreReady=true;
    return true;
  }
  function download(name,text) {
    if(global.URL && typeof global.URL.createObjectURL==='function') {
      const url=global.URL.createObjectURL(new Blob([text],{type:'application/json'}));
      const link=element('a'); link.href=url; link.download=name; document.body.appendChild(link); link.click(); link.remove();
      global.setTimeout(()=>global.URL.revokeObjectURL(url),1000);
    } else {
      const p=open(name); append(p,element('p','Copy the complete text below into a JSON file.'));
      const textArea=element('textarea'); textArea.value=text; textArea.setAttribute('aria-label','Backup contents'); append(p,textArea); textArea.select();
    }
  }
  function reviewBrokenBackup() {
    const backup=read(SAVE+'.broken.latest');
    if(!backup) { openData();notice('No diagnostic backup is available. Review a healthy checkpoint below.');return; }
    reviewRestore(backup, 'Recovered local save');
  }
  function exportBackup() { try { download('pokemon-battle-backup.json',JSON.stringify(makeBackup())); } catch(e) { if(!panel) openData(); notice(e.message); } }
  function runSummary(title, run, backupDate, empty = 'No Story run on this device.') {
    if (!run) return card(title, empty);
    const trainer = run.trainerProfile?.name || run.trainerName;
    const party = Array.isArray(run.team) ? run.team.map(mon => mon?.name).filter(name => typeof name === 'string') : [];
    const fields = [
      ['Trainer', typeof trainer === 'string' ? trainer : 'Trainer'],
      ['Last town', api()?.runLocation?.(run) || 'Unknown'],
      ['Badges', `${run.badges ?? 0}/8`],
      ['Party', party.join(', ') || 'No partner yet'],
      ['Saved', displayDate(run._lastSave) || displayDate(backupDate) || 'Date unavailable'],
    ];
    const list = element('dl', null, 'upgrade-restore-summary');
    for (const [term, description] of fields) append(list, element('dt', term), element('dd', description));
    return append(card(title), list);
  }
  function reviewRestore(value, source, {onInvalid, onCancel = close, message} = {}) {
    let backup, reviewed;
    try {
      backup = validateBackup(value);
      reviewed = restoreSnapshot(backup.entries);
    } catch (error) {
      if (onInvalid) onInvalid(error.message);
      else {
        if (!panel) openData();
        notice(error.message);
      }
      return;
    }
    const current = global.__storyExternalSave ? read(SAVE) : currentRun();
    const scopes = Object.keys(backup.entries);
    const replaced = scopes.filter(key => key === SAVE ? current : read(key) !== null);
    const p = open('Review restoration');
    dismiss = onCancel;
    p.classList.add('upgrade-dialog--restore');
    const body = element('div', null, 'upgrade-restore-body');
    body.tabIndex = 0;
    body.setAttribute('role', 'region');
    body.setAttribute('aria-label', 'Backup comparison');
    const details = backup.entries[SAVE] ? append(element('div', null, 'upgrade-grid'),
      runSummary('Incoming backup', backup.entries[SAVE], backup.createdAt), runSummary('On this device', current)) : null;
    const contents = element('ul', null, 'upgrade-scope');
    for (const key of scopes) append(contents, element('li', BACKUP_CONTENTS[key]));
    const conflict = message ? element('p', message, 'upgrade-feedback upgrade-error') : null;
    conflict?.setAttribute('role', 'status');
    append(body, element('p', source, 'upgrade-muted'), conflict);
    if (replaced.length) {
      append(body, element('p', `Restoring will replace your ${replaced.map(key => BACKUP_CONTENTS[key]).join(', ')}.`, 'upgrade-feedback upgrade-error'));
    } else if (backup.entries[SAVE]) {
      append(body, element('p', 'Restoring will create a Story run on this device.'));
    }
    append(body, details, element('h3', 'Included in this backup'), contents);
    const result = element('p', null, 'upgrade-feedback');
    result.setAttribute('role', 'status');
    result.hidden = true;
    const actions = element('div', null, 'upgrade-actions upgrade-restore-actions');
    const restore = button('Restore this backup', () => {
      try {
        restoreBackup(backup, reviewed);
        result.hidden = false;
        result.textContent = 'Restored successfully. Reloading your journey…';
        global.location.reload();
      } catch (error) {
        if (error instanceof StaleRestoreReview) {
          reviewRestore(backup, source, {onInvalid, onCancel, message: error.message});
          return;
        }
        result.hidden = false;
        result.classList.add('upgrade-error');
        result.textContent = error.message;
        result.scrollIntoView?.({block:'nearest'});
      }
    }, true);
    if (replaced.length) restore.classList.add('upgrade-danger');
    const blocked = restoreBlockedReason();
    if (blocked) {
      restore.disabled = true;
      append(body, element('p', blocked, 'upgrade-feedback'));
    }
    const backUp = current && backup.entries[SAVE] ? button('Back up current progress', exportBackup) : null;
    if (backUp) backUp.classList.add('upgrade-restore-export');
    append(actions, backUp, button('Cancel', onCancel), restore);
    append(body, result);
    append(p, body, actions);
  }
  function backupImport() {
    const field = element('div', null, 'upgrade-import');
    const label = element('label', 'Import a backup file');
    const input = element('input'); input.type = 'file'; input.accept = '.json,application/json';
    input.id = 'upgrade-backup-file';
    label.htmlFor = input.id;
    const error = element('p', null, 'upgrade-feedback upgrade-error');
    error.id = 'upgrade-backup-error';
    error.hidden = true;
    error.setAttribute('role', 'status');
    input.setAttribute('aria-describedby', error.id);
    const showError = message => {
      input.value = '';
      input.setAttribute('aria-invalid', 'true');
      error.hidden = false;
      error.textContent = message;
      error.scrollIntoView?.({ block: 'nearest' });
    };
    let selection = 0;
    input.addEventListener('change', async () => {
      const file = input.files[0];
      if (!file) return;
      const request = ++selection;
      input.removeAttribute('aria-invalid');
      error.hidden = true;
      error.textContent = '';
      if (file.size > 10 * 1024 * 1024) return showError('Choose a Pokémon Arena backup smaller than 10 MB.');
      let value;
      try {
        value = JSON.parse(await file.text());
      } catch (_) {
        if (request === selection && input.isConnected) showError('Could not read this file. Choose a Pokémon Arena JSON backup.');
        return;
      }
      if (request === selection && input.isConnected) reviewRestore(value, file.name, {
        onInvalid: showError,
        onCancel: () => openData().querySelector('#upgrade-backup-file')?.focus(),
      });
    });
    return append(field, label, input, error);
  }
  function openData() {
    const p = open('Save & recovery');
    p.classList.add('upgrade-dialog--data');
    const stored = read(SAVE);
    const current = currentRun(stored);
    const lastSave = displayDate(stored?._lastSave) || displayDate(current?._lastSave);
    const saveStatus = global.GameStorage.readStory().status;
    const saveProblem = global.GameStorage.storyProblem(saveStatus);
    const status = global.__storySaveError || saveProblem || (lastSave ? `Last saved ${lastSave}`
      : current ? 'Story run saved on this device.' : 'No Story run on this device.');
    append(p, element('p', status, global.__storySaveError || saveProblem ? 'upgrade-feedback upgrade-error' : null));
    if (saveStatus === 'newer') {
      const title = element('a', 'Check for updates from the title');
      title.href = 'index.html';
      append(p, title);
    }
    const hasProgress = current || read(META) || SLOT_KEYS.some(key => read(key));
    const hasBackup = hasProgress || portableSettings(read(SETTINGS)) || read(PREFS);
    const backup = element('div', null, 'upgrade-backup');
    if (hasBackup) {
      const actions = element('div', null, 'upgrade-actions');
      append(actions, button(hasProgress ? 'Download complete backup' : 'Download settings backup', exportBackup, true));
      if (global.__storySaveError && global.StoryMode?.state.active) {
        append(actions, button('Retry saving', () => { api()?.save(); openData(); }));
      }
      append(backup, actions);
    }
    append(p, append(backup, backupImport()));
    const grid=element('div',null,'upgrade-grid');
    for(const [index, key] of SLOT_KEYS.entries()) {
      const i = index + 1, slot=read(key);
      if (!slot && !current) continue;
      const date = displayDate(slot?.createdAt);
      const c=card(`Save slot ${i}`,slot ? (date ? `Saved ${date}` : 'Saved backup') : 'Empty');
      if (current) append(c,button(slot?'Replace this slot':'Save here',async()=>{
        if(slot && !await global.showGameConfirm('Replace this saved slot? Your active run will stay in place.'))return;
        try{global.localStorage.setItem(key,JSON.stringify(makeBackup(false)));openData();}catch(e){notice(e.message);}
      }));
      if(slot)append(c,button('Review and load',()=>reviewRestore(slot,`Save slot ${i}`))); append(grid,c);
    }
    if (grid.childElementCount) append(p,element('h3','Local save slots'),grid);
    const checkpoints = element('div', null, 'upgrade-actions');
    for(const [key,labelText] of [[SAVE+'.checkpoint','Latest checkpoint'],[SAVE+'.checkpoint.previous','Earlier checkpoint']]) {
      const run=read(key); if(run)append(checkpoints,button(`Review ${labelText.toLowerCase()}`,()=>reviewRestore(run,labelText)));
    }
    if (checkpoints.childElementCount) append(p,element('h3','Automatic checkpoints'),checkpoints);
    return p;
  }

  function applyPreferences() {
    const prefs=global.GameStorage.readRecord(PREFS);
    document.body.classList.toggle('upgrade-readable',prefs.readable === true);
    document.body.classList.toggle('upgrade-large-text',prefs.largeText === true);
    document.body.classList.toggle('upgrade-reduced-motion',prefs.reducedMotion === true);
    global.__accessibleCamp=prefs.camp === true;
    global.__reduceGameMotion=prefs.reducedMotion === true;
    global.refreshReducedMotionSettings?.();
    for (const input of panel?.querySelectorAll('[data-upgrade-preference]') || []) {
      input.checked = prefs[input.dataset.upgradePreference] === true;
    }
  }
  function openPreferences() {
    const p=open('Reading & accessibility');
    p.classList.add('upgrade-dialog--preferences');
    const feedback = element('p', null, 'upgrade-feedback upgrade-error');
    feedback.setAttribute('role', 'status');
    feedback.hidden = true;
    for(const [key,labelText,hint] of [
      ['readable','Use a readable interface font'],
      ['largeText','Larger Notebook and story text'],
      ['reducedMotion','Reduce interface motion'],
      ['camp','Use untimed camp activities','The rewards stay the same.'],
    ]) {
      const label=element('label',null,'upgrade-preference'), input=element('input');
      input.type='checkbox';
      input.dataset.upgradePreference = key;
      input.addEventListener('change',()=>{
        const saved = global.GameStorage.updateRecord(PREFS, { [key]: input.checked });
        applyPreferences();
        feedback.hidden = saved;
        feedback.textContent = saved ? '' : 'This preference could not be saved.';
      });
      const caption=element('span',labelText);
      if (hint) {
        input.setAttribute('aria-label', labelText);
        input.setAttribute('aria-describedby', 'upgrade-preference-camp-hint');
        const detail=element('small',hint); detail.id='upgrade-preference-camp-hint';
        append(caption,detail);
      }
      append(p,append(label,input,caption));
    }
    append(p,feedback);
    applyPreferences();
  }
  function saveResult(ok) {
    const existing=document.getElementById('upgrade-save-alert');
    if(ok) {if(existing)existing.remove();return;}
    const finale=document.querySelector('.story-league-finale[data-gallery-motif]:not([inert]):has([data-narr-choices])');
    if(finale?.__showFinaleSaveRecovery) {
      existing?.remove();
      finale.__showFinaleSaveRecovery();
      return;
    }
    const offer=document.querySelector('#screen-story-professor:not(.hidden) #prof-accept-btn:not(:disabled)');
    if(offer) {
      existing?.remove();
      document.getElementById('story-prof-status').textContent=global.__storyExternalSave
        ? 'Your partner could not be saved. Back up and reload.'
        : 'Your partner could not be saved. Choose again to retry.';
      if(!document.getElementById('prof-save-backup')) {
        const backup=button('Back up now',exportBackup);
        backup.id='prof-save-backup';
        offer.after(backup);
      }
      return;
    }
    const summary = document.querySelector('#modal-summary:not(.hidden):not([inert]) #summary-pages-scroll');
    const host = summary || document.body;
    const alert = existing || element('aside', null, 'upgrade-save-alert');
    if (!existing) {
      alert.id = 'upgrade-save-alert';
      alert.setAttribute('role', 'alert');
      append(alert, element('p'), button('Back up now', exportBackup), button('Retry', () => api() && api().save()));
    }
    alert.querySelector('p').textContent = global.__storySaveError
      || 'Progress could not be saved. Keep this page open and back up your current progress.';
    alert.classList.toggle('upgrade-save-alert--inline', Boolean(summary));
    if (alert.parentElement !== host) host.prepend(alert);
  }
  function runPassport() {
    const s=api().snapshot();
    return {format:'battle-run-passport',version:1,game:VERSION,rules:RULESET,seed:s.seed,difficulty:s.difficulty,settings:s.settings,tracks:s.tracks,badges:s.badges,team:s.team};
  }
  function exportBugReport() {
    const report={format:'battle-bug-report',game:VERSION,rules:RULESET,createdAt:new Date().toISOString(),
      run:api()?runPassport():null,events:api()?api().events():[],saveError:global.__storySaveError || null};
    download('pokemon-battle-bug-report.json',JSON.stringify(report,null,2));
  }
  function campActivity(game, onResult) {
    const p=open(game.name || 'Camp together');
    p.classList.add('camp-timing-free');
    if (game.partnerName) {
      const partner=element('div', null, 'camp-activity-partner');
      if (game.partnerSprite) {
        const sprite=element('img');
        sprite.alt=''; sprite.src=game.partnerSprite;
        partner.appendChild(sprite);
      }
      append(p, append(partner, element('strong',game.partnerName)));
    }
    append(p,element('p','Take your time. Spend a quiet moment with your partner for the same bond progress as a successful timed activity.'));
    let settled=false;
    const finish=(won)=>{if(settled)return;settled=true;close();onResult(won);};
    append(p,button('Spend time together',()=>finish(true),true),button('Cancel activity',()=>finish(null)));
    // Every dismissal settles the pending camp action.
    dismiss=()=>finish(null);
    p.querySelector('.upgrade-header button').textContent='Cancel';
  }
  global.GameUpgrades={openNotebook,openPractice,openData,openPreferences,openBattleReview,saveResult,campActivity,
    exportBackup,reviewBrokenBackup,makeBackup,validateBackup,restoreBackup,runPassport,analyzeTeam,close,
    observeBattle,normalizeBattleObservation,describeBattleObservation,VERSION,RULESET};
  global.addEventListener('storage',event=>{
    if (event.key === PREFS || event.key === null) applyPreferences();
    if(event.key===SAVE && event.oldValue!==event.newValue && global.StoryMode?.state.active) {
      global.__storyExternalSave=true;
      global.__storySaveError='Another game tab changed this save. Back up this session, then reload to load the other tab’s progress.';
      saveResult(false);
    }
  });
  // An interrupted multi-key import is rolled back before the player continues.
  const pending=read(RESTORE_JOURNAL);
  if(pending && typeof pending==='object') {
    try {
      for(const [key,value] of Object.entries(pending)) if(PORTABLE_KEYS.includes(key)) {
        if(value===null)global.localStorage.removeItem(key);else if(typeof value==='string')global.localStorage.setItem(key,value);
      }
      global.localStorage.removeItem(RESTORE_JOURNAL);
    } catch(_) { global.__storySaveError='An interrupted restore needs recovery. Back up your data before continuing.'; }
  }
  applyPreferences();
  if(global.__storySaveError)saveResult(false);
})(window);
