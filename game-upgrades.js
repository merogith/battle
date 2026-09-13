/* Player-facing tools built on StoryMode's deterministic product interface. */
(function (global) {
  'use strict';
  const VERSION = '1.8.0';
  const RULESET = 'story-singles-2026-09';
  const SAVE = 'pbs_story_save';
  const PREFS = 'pbs_accessibility';
  const KEYS = [SAVE, 'pbs_story_meta', 'pbs_settings', PREFS];
  const SERVICES = [
    ['mentor','Build a stronger team','Battle Mentor','Review a priced upgrade plan. Choose the changes you want.'],
    ['tutor','Teach or replace moves','Move Tutor','Compare attacks, coverage and utility. Earlier towns have smaller move pools.'],
    ['dojo','Choose items and abilities','Battle Dojo','Each belt opens more choices. Read the effect before changing your build.'],
    ['nature','Change a nature','Nature Rater','Trade one stat for another. Check the exact before-and-after values.'],
    ['evolab','Evolve a partner','Evolution Tutor','Check the stage, fee and any stone or trade requirement.'],
    ['evtrainer','Train your stats','EV Trainer','Early access redistributes earned EVs; full spread purchases open later.'],
    ['fanclub','Improve individual stats','Pokémon Fan Club','IV upgrades improve a partner’s potential. They are separate from EV training.'],
    ['center','Manage party and storage','Pokémon Center','Swap between your party and PC. Your current party cap still applies.'],
    ['stoneShop','Find evolution items','Stones and Beyond','Get the stone or trade item required by an evolution.'],
    ['link','Prepare a trade evolution','Cable Link','Visit before using the Evolution Tutor for a trade evolution.'],
    ['colress','Learn battle transformations','Power Up','Review Mega, Z-Moves, Dynamax and Tera under this run’s rules.'],
    ['mart','Stock your battle bag','Poké Mart','Consumables help within a battle. Compare purchases with permanent upgrades.'],
    ['daycare','Care for your partners','Daycare Inn','Review the available care services and their costs.'],
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

  let overlay = null, panel = null, returnFocus = null, inertElements = [];
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
    if (overlay) overlay.remove();
    overlay = panel = null;
    for (const [node, old] of inertElements) node.inert = old;
    inertElements = [];
    if (returnFocus && returnFocus.isConnected) returnFocus.focus();
    returnFocus = null;
  }
  function open(title) {
    if (!overlay) {
      returnFocus = document.activeElement;
      inertElements = [...document.querySelectorAll('.screen,.modal')].map(n => [n, n.inert]);
      for (const [node] of inertElements) node.inert = true;
      overlay = element('div', null, 'upgrade-overlay');
      panel = element('div', null, 'upgrade-dialog');
      panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true');
      panel.setAttribute('aria-labelledby', 'upgrade-title'); panel.tabIndex = -1;
      overlay.appendChild(panel); document.body.appendChild(overlay);
      overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
      overlay.addEventListener('keydown', e => {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
        if (e.key === 'Tab') {
          const items = [...panel.querySelectorAll('button:not(:disabled),input,textarea,select,a[href]')].filter(n => !n.hidden);
          const first = items[0], last = items[items.length - 1];
          if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) { e.preventDefault(); last && last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first && first.focus(); }
        }
      });
    }
    panel.replaceChildren();
    const heading = element('h2', title); heading.id = 'upgrade-title';
    append(panel, append(element('header', null, 'upgrade-header'), heading, button('Close', close)));
    panel.focus(); return panel;
  }
  function notice(text) { const n = element('p', text, 'upgrade-feedback'); n.setAttribute('role','status'); panel.appendChild(n); return n; }
  function read(key, fallback = null) {
    try { const raw = global.localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (_) { return fallback; }
  }
  function activeBattle() { return !!(api() && api().battleActive()); }

  function analyzeTeam(team, effectiveness) {
    const notes = [];
    if (!team.length) return ['Choose your first partner, then revisit this page.'];
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

  function openNotebook(tab = 'next') {
    if (!['next','team','story','rules'].includes(tab)) tab = 'next';
    const p = open('Trainer’s Notebook');
    if (!api()) return notice('Game data is still loading. Close this page and try again shortly.');
    const s = api().snapshot();
    const nav = element('nav',null,'upgrade-tabs'); nav.setAttribute('aria-label','Notebook pages');
    for (const [id,label] of [['next','What next?'],['team','My team'],['story','Story & clues'],['rules','Battle rules']]) {
      const b = button(label,()=>openNotebook(id)); if (tab === id) b.setAttribute('aria-current','page'); nav.appendChild(b);
    }
    append(p,nav);
    if (tab === 'next') {
      append(p,card(s.active ? s.goal : 'Begin your adventure',s.active ? `${s.badges}/8 badges · ${s.gold.toLocaleString()}G · ${s.team.length}/${s.cap} partners` : 'Choose Story Mode, create your trainer, and meet your first partner.'));
      append(p,element('p','Your next story action moves the journey forward. Preparation is a choice: use the services below when you need them.'));
      if (s.inCity) append(p,button('Go to my next action',()=>{ close(); const target=document.querySelector('#screen-story-city .story-city-objective'); if(target) target.click(); },true));
      const grid=element('div',null,'upgrade-grid');
      for (const [key,purpose,name,description] of SERVICES) {
        const unlocked=s.active && s.city >= (s.facilities[key] ?? Infinity);
        const c=card(purpose,`${name} — ${description}`);
        append(c,element('small',unlocked ? 'Available at this stage' : `Opens in City ${s.facilities[key] ?? '—'}`));
        if (unlocked && s.inCity) append(c,button(`Visit ${name}`,()=>{ close(); api().visit(key); }));
        grid.appendChild(c);
      }
      append(p,grid,button('Practice a battle concept',openPractice),button('Back up or restore progress',openData));
    } else if (tab === 'team') {
      for (const note of analyzeTeam(s.team,api().typeEffectiveness)) append(p,element('p',note,'upgrade-feedback'));
      append(p,element('p','These suggestions are starting points, not requirements. Keep the partners and strategies you enjoy. Training stats below exclude temporary battle stages.'));
      const grid=element('div',null,'upgrade-grid');
      for (const mon of s.team) {
        const c=card(`${mon.favorite ? '★ ' : ''}${mon.name}`,`${mon.types.join(' / ')} · Level ${mon.level} · ${mon.nature}`);
        append(c,element('p',`${mon.ability} · ${mon.item}`),element('p',`HP ${mon.hp} · Atk ${mon.stats.atk} · Def ${mon.stats.def} · SpA ${mon.stats.spa} · SpD ${mon.stats.spd} · Spe ${mon.stats.spe}`));
        const list=element('ul'); for(const move of mon.moves) append(list,element('li',`${move.name} — ${move.type || '—'} / ${move.category || '—'}`));
        append(c,list,button(mon.favorite ? 'Unprotect favorite' : 'Protect as favorite',()=>{api().favorite(mon.id);openNotebook('team');}));
        grid.appendChild(c);
      }
      append(p,grid);
      if(s.storage?.length) {
        const storage=append(element('details'),element('summary','Protect partners in storage'));
        for(const mon of s.storage) append(storage,append(card(mon.name),button(mon.favorite ? 'Unprotect favorite' : 'Protect as favorite',()=>{api().favorite(mon.id);openNotebook('team');})));
        append(p,storage);
      }
      if(s.inCity) append(p,button('Review upgrades with the Mentor',()=>{close();api().visit('mentor');},true));
      append(p,button('Export run passport',()=>download('battle-run-passport.json',JSON.stringify(runPassport(),null,2))));
    } else if(tab === 'story') {
      append(p,element('p',s.thread));
      // Existing journal renderer escapes player-owned values and gates discovered story beats.
      const journal=element('div',null,'story-journal-body'); journal.innerHTML=s.journal; append(p,journal);
    } else {
      append(p,card('Strategic singles','One active Pokémon per side. Most builds use level 50; EXP-Share gifts can reach level 53. This is a custom campaign, with its own progression and encounter modifiers.'));
      append(p,card('Know your run',`Difficulty: ${s.difficulty}. Transformations, generation restrictions and bag rules come from your run settings. Boss stat scaling, camp bonuses and custom builds can change familiar matchups.`));
      append(p,card('How opponents think','The current AI scores moves and switches using battle state, including your team’s actual builds. Difficulty changes its move selection and prediction strength. It is a heuristic opponent, not a perfect solver.'));
      append(p,card('Learn the layers','Priority is checked before Speed. Nature, IVs and EVs determine trained stats. Stages modify them during battle. Type, weather, items and abilities can alter damage or make an attack fail.'));
      append(p,card('This update','Progression modifiers persist through form changes. Gender metadata, several ability/item interactions and save failure reporting have been corrected. Notebook, practice lessons and complete backup tools are available here.'));
      append(p,element('p',`Game ${VERSION} · Rules ${RULESET}`),button('Explain the current battle',openBattleReview));
    }
  }

  function openPractice(index = 0) {
    index = Number.isInteger(index) ? index : 0;
    const p=open('Practice lessons');
    append(p,element('p','Try a decision, read the explanation, and try again. These lessons do not change your team, money, story progress or battle RNG.'));
    const nav=element('div',null,'upgrade-actions');
    LESSONS.forEach((lesson,i)=>append(nav,button(`${i+1}. ${lesson.title}`,()=>openPractice(i)))); append(p,nav);
    const lesson=LESSONS[index] || LESSONS[0]; append(p,element('h3',lesson.title),element('p',lesson.prompt));
    const feedback=element('p',null,'upgrade-feedback'); feedback.hidden=true; feedback.setAttribute('role','status');
    lesson.choices.forEach((choice,i)=>append(p,button(choice,()=>{
      feedback.hidden=false; feedback.textContent=`${i===lesson.answer ? 'Correct.' : 'Try another approach.'} ${lesson.explanation}`;
    })));
    append(p,feedback,button('Next lesson',()=>openPractice((index+1)%LESSONS.length)));
  }

  function openBattleReview() {
    const p=open('Explain this battle');
    const events=api() ? api().events() : [];
    append(p,element('p','Recorded outcomes from the current or most recent battle. Calculations describe a direct hit before survival effects, fixed-damage overrides and custom encounter modifiers; the battle log records the final outcome.'));
    const calculations=events.filter(e=>e.kind==='calculation').slice(-12);
    if(!calculations.length) append(p,element('p','No attack calculation has been recorded yet. Play a battle, then return here.'));
    for(const e of calculations.reverse()) {
      append(p,card(`Turn ${e.turn}: ${e.attacker} → ${e.defender}`,`${e.move} · ${e.category} · effective power ${e.basePower}. Type multiplier ×${e.effectiveness}; same-type bonus ×${e.stab}${e.critical ? '; critical hit' : ''}${e.weather ? `; weather: ${e.weather}` : ''}. Calculated damage: ${e.damage}.`));
    }
    const details=element('details'); append(details,element('summary','Recent battle log'));
    const log=element('ol'); events.filter(e=>e.kind==='message').slice(-60).forEach(e=>append(log,element('li',e.text))); append(details,log); append(p,details);
    const received=calculations.filter(e=>!e.playerAttacking && e.effectiveness>1);
    if(received.length) append(p,card('One preparation question',`Your team received ${received.length} recorded super-effective attack${received.length===1?'':'s'}. Check whether an available partner can switch into that type. This is an observation, not a complete explanation of the result.`));
    append(p,button('Review my team',()=>openNotebook('team')),button('Export a bug report',exportBugReport));
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
    if(backup.version!==1 || !backup.entries || typeof backup.entries!=='object' || Array.isArray(backup.entries)) throw new Error('Unsupported backup format.');
    if(Object.values(backup.entries).some(v=>!v || typeof v!=='object' || Array.isArray(v))) throw new Error('Backup entries must be data objects.');
    if(Object.keys(backup.entries).some(k=>!KEYS.includes(k))) throw new Error('Backup contains unknown storage entries.');
    const run=backup.entries[SAVE];
    if(!run || !Number.isInteger(run.version) || run.version<2 || run.version>(api()?.saveVersion || 28) || !Array.isArray(run.team)) throw new Error('This run is missing required data or uses a newer save version.');
    if(!Number.isFinite(run.gold) || run.gold<0 || !Number.isInteger(run.badges) || run.badges<0 || run.badges>8) throw new Error('This run contains invalid progress values.');
    if(run.team.length>6 || (run.pcBox!==undefined && !Array.isArray(run.pcBox)) || [...run.team,...(run.pcBox || [])].some(m=>!m || typeof m.name!=='string' || !m.name.trim() || !m.build || (!m.isEgg && (!Array.isArray(m.build.m) || m.build.m.length<1 || m.build.m.length>4 || m.build.m.some(n=>typeof n!=='string' || !n.trim()))))) throw new Error('This run contains an invalid party.');
    if(!Number.isInteger(run.eventIndex) || run.eventIndex<0 || run.eventIndex>(api()?.maxEventIndex ?? 100)) throw new Error('This run contains an invalid journey position.');
    return backup;
  }
  function makeBackup() {
    const entries={};
    for(const key of KEYS) { const value=read(key); if(value!==null) entries[key]=value; }
    const state=global.StoryMode && global.StoryMode.state;
    // On failed persistence the in-memory run is the newest recoverable progress.
    if(state && state.active && !global.__storyRestoreReady) entries[SAVE]=JSON.parse(JSON.stringify(state));
    if(!entries[SAVE]) throw new Error('There is no run to back up yet.');
    return {format:'battle-backup',version:1,game:VERSION,rules:RULESET,createdAt:new Date().toISOString(),entries};
  }
  function restoreBackup(value) {
    if(activeBattle()) throw new Error('Finish the battle before restoring a backup.');
    const b=validateBackup(value), previous={};
    for(const key of Object.keys(b.entries)) previous[key]=global.localStorage.getItem(key);
    // Keep a recovery journal until every write succeeds. Never include connection tokens.
    global.localStorage.setItem('pbs_restore_pending',JSON.stringify(previous));
    try {
      for(const [key,data] of Object.entries(b.entries)) global.localStorage.setItem(key,JSON.stringify(data));
      global.localStorage.removeItem('pbs_restore_pending');
    } catch(error) {
      let restored=true;
      for(const [key,data] of Object.entries(previous)) {
        try { if(data===null) global.localStorage.removeItem(key); else global.localStorage.setItem(key,data); } catch(_) { restored=false; }
      }
      if(restored) global.localStorage.removeItem('pbs_restore_pending');
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
    reviewRestore(backup);
  }
  function exportBackup() { try { download('pokemon-battle-backup.json',JSON.stringify(makeBackup(),null,2)); } catch(e) { if(!panel) openData(); notice(e.message); } }
  function reviewRestore(value) {
    try {
      const b=validateBackup(value); const run=b.entries[SAVE]; const p=open('Review restoration');
      append(p,element('p',`${run.badges}/8 badges · ${run.team.map(m=>m.name).join(', ') || 'No partner yet'}`),element('p',`This replaces: ${Object.keys(b.entries).map(k=>({[SAVE]:'current run',pbs_story_meta:'collection records',pbs_settings:'settings',[PREFS]:'accessibility preferences'})[k]).join(', ')}. Back up your current progress first if you want to keep both.`));
      append(p,button('Back up current progress',exportBackup),button('Restore this backup',()=>{
        try { restoreBackup(b); notice('Restored successfully. Reloading your journey…'); global.location.reload(); append(p,button('Reload game',()=>global.location.reload(),true)); }
        catch(e) { notice(e.message); }
      },true));
    } catch(e) { if(!panel) openData(); notice(e.message); }
  }
  function openData() {
    const p=open('Save & recovery'); const state=global.StoryMode && global.StoryMode.state;
    append(p,element('p',global.__storySaveError || (state?._lastSave ? `Last successful save: ${new Date(state._lastSave).toLocaleString()}` : 'No successful save recorded this session.')),
      element('p','Backups include your run, saved collection records, settings and accessibility preferences. They stay on your device unless you choose to share the file.'));
    append(p,button('Download complete backup',exportBackup,true),button('Retry saving',()=>{if(api()) {api().save();openData();}}));
    const label=element('label','Import a backup file'); const input=element('input'); input.type='file'; input.accept='.json,application/json';
    input.addEventListener('change',async()=>{ const f=input.files[0]; if(!f)return; if(f.size>5*1024*1024)return notice('Choose a backup smaller than 5 MB.'); try {reviewRestore(JSON.parse(await f.text()));}catch(e){notice(`Could not read backup: ${e.message}`);} }); append(label,input); append(p,label);
    const grid=element('div',null,'upgrade-grid');
    for(let i=1;i<=3;i++) {
      const key=`pbs_slot_${i}`, stored=read(key); const c=card(`Save slot ${i}`,stored ? `Saved ${new Date(stored.createdAt).toLocaleString()}` : 'Empty');
      append(c,button(stored?'Replace this slot':'Save here',async()=>{
        if(stored && !await global.showGameConfirm('Replace this saved slot? Your active run will stay in place.'))return;
        try{global.localStorage.setItem(key,JSON.stringify(makeBackup()));openData();}catch(e){notice(e.message);}
      }));
      if(stored)append(c,button('Review and load',()=>reviewRestore(stored))); append(grid,c);
    }
    append(p,grid);
    for(const [key,labelText] of [[SAVE+'.checkpoint','Latest checkpoint'],[SAVE+'.checkpoint.previous','Earlier checkpoint']]) {
      const run=read(key); if(run)append(p,button(`Review ${labelText.toLowerCase()}`,()=>reviewRestore(run)));
    }
    append(p,element('p','Clearing browser site data removes local saves and slots. Download a backup before clearing data or moving devices.','upgrade-muted'));
  }

  function applyPreferences() {
    const prefs=read(PREFS,{});
    document.body.classList.toggle('upgrade-readable',!!prefs.readable);
    document.body.classList.toggle('upgrade-large-text',!!prefs.largeText);
    document.body.classList.toggle('upgrade-reduced-motion',!!prefs.reducedMotion);
    global.__accessibleCamp=!!prefs.camp;
    global.__reduceGameMotion=!!prefs.reducedMotion;
    if(prefs.reducedMotion && api()) {
      const settings=api().settings();settings.animations=false;settings.ambientParticles=false;settings.weatherAnimation=false;
    }
  }
  function openPreferences() {
    const p=open('Reading & accessibility'), prefs=read(PREFS,{});
    for(const [key,labelText] of [['readable','Use a readable interface font'],['largeText','Larger Notebook and story text'],['reducedMotion','Reduce interface motion'],['camp','Use untimed camp activities']]) {
      const label=element('label'), input=element('input');input.type='checkbox';input.checked=!!prefs[key];
      input.addEventListener('change',()=>{prefs[key]=input.checked;try{global.localStorage.setItem(PREFS,JSON.stringify(prefs));applyPreferences();}catch(e){notice('This preference could not be saved.');}});
      append(label,input,document.createTextNode(labelText));append(p,label);
    }
    append(p,element('p','Battle speed, animation switches and independent music/SFX volume remain in Settings. Untimed camp activities provide the same successful activity reward.'));
  }
  function saveResult(ok) {
    const existing=document.getElementById('upgrade-save-alert');
    if(ok) {if(existing)existing.remove();return;}
    if(existing) {existing.querySelector('p').textContent=global.__storySaveError || 'Progress could not be saved. Keep this page open and back up your current progress.';return;}
    const alert=element('aside',null,'upgrade-save-alert');alert.id='upgrade-save-alert';alert.setAttribute('role','alert');
    append(alert,element('p',global.__storySaveError || 'Progress could not be saved. Keep this page open and back up your current progress.'),button('Back up now',exportBackup),button('Retry',()=>api() && api().save()));document.body.appendChild(alert);
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
    append(p,element('p','Take your time. Spend a quiet moment caring for your partner. This gives the same reward as completing the activity successfully.'));
    let settled=false;
    const finish=(won)=>{if(settled)return;settled=true;close();onResult(won);};
    append(p,button('Spend time together',()=>finish(true),true),button('Cancel activity',()=>finish(false)));
    // Use an explicit cancellation path so dismissing cannot leave the camp action locked.
    const closeButton=p.querySelector('.upgrade-header button');
    closeButton.replaceWith(button('Cancel',()=>finish(false)));
    overlay.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();finish(false);}},true);
    overlay.addEventListener('click',e=>{if(e.target===overlay){e.stopImmediatePropagation();finish(false);}},true);
  }
  global.GameUpgrades={openNotebook,openPractice,openData,openPreferences,openBattleReview,saveResult,campActivity,
    exportBackup,reviewBrokenBackup,makeBackup,validateBackup,restoreBackup,runPassport,analyzeTeam,close,VERSION,RULESET};
  global.addEventListener('storage',event=>{
    if(event.key===SAVE && event.oldValue!==event.newValue && global.StoryMode?.state.active) {
      global.__storyExternalSave=true;
      global.__storySaveError='Another game tab changed this save. Back up this session, then reload to load the other tab’s progress.';
      saveResult(false);
    }
  });
  // An interrupted multi-key import is rolled back before the player continues.
  const pending=read('pbs_restore_pending');
  if(pending && typeof pending==='object') {
    try {
      for(const [key,value] of Object.entries(pending)) if(KEYS.includes(key)) {
        if(value===null)global.localStorage.removeItem(key);else if(typeof value==='string')global.localStorage.setItem(key,value);
      }
      global.localStorage.removeItem('pbs_restore_pending');
    } catch(_) { global.__storySaveError='An interrupted restore needs recovery. Back up your data before continuing.'; }
  }
  applyPreferences();
  if(global.__storySaveError)saveResult(false);
})(window);
