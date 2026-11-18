const progress = globalThis.AdventureProgress;
const choiceKey = id => `adventure.${id}`;
const secretKey = id => `adventure.secret.${id}`;
const scenery = {
    pallet: 'route1-unlit-signal.webp',
    mines: 'mineshaft-pass.webp',
    school: 'recovery-school.webp',
    ranger: 'recovery-ranger.webp',
    lake: 'recovery-lake.webp',
    yard: 'recovery-yard.webp',
    highlands: 'recovery-highlands.webp',
    cathedral: 'cathedral-approach.webp',
    league: 'recovery-league.webp',
    crucible: 'recovery-crucible.webp',
};
const chapterFiles = ['opening', 'early', 'middle', 'finale'];
let chapterRequest;

function loadChapters() {
    chapterRequest ||= Promise.all(chapterFiles.map(async part => {
        const response = await fetch(new URL(`./adventure-${part}.json`, import.meta.url));
        if (!response.ok) throw new Error(`Unable to open field chapters (${response.status})`);
        return response.json();
    })).then(pages => pages.flat()).catch(error => {
        chapterRequest = null;
        throw error;
    });
    return chapterRequest;
}

function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
}

function button(label, attribute, value, action, primary = false) {
    const node = element('button', `adventure-button${primary ? ' adventure-button-primary' : ''}`, label);
    node.type = 'button';
    node.setAttribute(`data-adventure-${attribute}`, value);
    node.addEventListener('click', action);
    return node;
}

function chosen(chapter, choices) {
    return chapter.choices.find(option => option.id === choices[choiceKey(chapter.id)]);
}

function hasTrail(chapter, chapters, choices) {
    return Boolean(chosen(chapter, choices)?.clue && chapter.secret.requires.every(id => {
        const earlier = chapters.find(entry => entry.id === id);
        return earlier && chosen(earlier, choices)?.clue;
    }));
}

function sound(key, volume) {
    if (key) globalThis.StoryFx?.playSfx?.(key, volume);
}

export async function mountAdventure(host, city, bridge) {
    const chapters = await loadChapters();
    if (!host.isConnected || !bridge.isCurrent()) return;
    const here = chapters.find(chapter => chapter.city === city);
    if (!here) return;

    function snapshot(sync = true) {
        const run = bridge.readRun();
        let archive = progress.normalize(bridge.readArchive());
        const choices = progress.reconcileChoices(archive, run.runId, run.storyChoices || {});
        if (sync && run.runId && bridge.isCurrent()) {
            const recorded = progress.record(archive, { ...run, storyChoices: choices });
            archive = recorded.archive;
            if (recorded.changed) bridge.writeArchive(archive);
        }
        return { run, archive, choices };
    }

    function commit(key, value) {
        const { run, choices } = snapshot();
        if ([true, 'listen', 'act'].includes(choices[key]) || !bridge.isCurrent()) return false;
        const runId = run.runId || progress.createRunId();
        if (!bridge.writeRun({ ...choices, [key]: value }, runId)) return false;
        snapshot();
        return true;
    }

    let origin;
    const card = element('aside', 'story-chapter-card');
    const invitation = element('div', 'story-chapter-invitation');
    const invitationContext = city === 1 ? 'Optional story' : here.place;
    const eyebrow = element('p', 'story-chapter-eyebrow', `${invitationContext} · ${here.speaker.name}`);
    const teaser = element('p', 'story-chapter-teaser', here.invitation);
    const open = button(here.title, 'open', here.id, () => {
        origin = open;
        const saved = chosen(here, snapshot().choices);
        openScene(here, { saved, fromArchive: false, readOnly: false });
    }, true);
    invitation.append(eyebrow, open, teaser);
    const archiveButton = button('Field Archive', 'archive', '', () => {
        origin = archiveButton;
        openArchive();
    });
    card.append(invitation, archiveButton);
    const keepsakeSlot = city === null ? element('div', 'story-archive-keepsake-slot') : null;
    if (keepsakeSlot) card.append(keepsakeSlot);
    host.replaceChildren(card);
    host.hidden = false;

    function updateCard() {
        const { choices, archive } = snapshot(false);
        teaser.textContent = chosen(here, choices) ? 'Scene recorded in your Field Archive.' : here.invitation;
        if (keepsakeSlot) {
            const copy = progress.summarize(archive).keepsakes.find(item => item.id === 'keepers-spare-copy');
            keepsakeSlot.hidden = !copy;
            if (!copy) keepsakeSlot.replaceChildren();
            else if (!keepsakeSlot.firstChild) {
                keepsakeSlot.append(button('Inspect the clerk’s copy', 'crucible-keepsake', copy.id, event => {
                    origin = event.currentTarget;
                    openKeepsake(copy, false);
                }));
            }
        }
    }

    let dialog;
    let shell;
    let title;
    let body;
    let location;
    let pageProgress;
    let stopRelayMotif;
    function show(titleText, place, art) {
        stopRelayMotif?.();
        stopRelayMotif = null;
        if (!dialog || !dialog.open) {
            dialog = element('dialog', 'story-chapter-dialog');
            dialog.setAttribute('aria-labelledby', 'story-chapter-title');
            shell = element('div', 'story-chapter-shell');
            const heading = element('header', 'story-chapter-heading');
            const labels = element('div', 'story-chapter-labels');
            location = element('p', 'story-chapter-eyebrow');
            title = element('h2', 'story-chapter-title');
            title.id = 'story-chapter-title';
            title.tabIndex = -1;
            labels.append(location, title);
            heading.append(labels, button('Close', 'close', '', () => dialog.close()));
            pageProgress = element('progress', 'story-chapter-progress');
            pageProgress.setAttribute('aria-label', 'Scene progress');
            body = element('div', 'story-chapter-body');
            shell.append(heading, pageProgress, body);
            dialog.append(shell);
            document.body.append(dialog);
            const opened = dialog;
            opened.addEventListener('close', () => {
                opened.remove();
                if (dialog !== opened) return;
                stopRelayMotif?.();
                stopRelayMotif = null;
                updateCard();
                if (origin?.isConnected) origin.focus({ preventScroll: true });
            }, { once: true });
            dialog.showModal();
        }
        const image = scenery[art];
        if (image) {
            const url = new URL(`../../sprites/backgrounds/story/${image}`, import.meta.url);
            shell.style.setProperty('--chapter-art', `url("${url.href}")`);
        } else {
            shell.style.removeProperty('--chapter-art');
        }
        const placeChapter = chapters.find(chapter => chapter.place === place);
        const town = placeChapter && bridge.townName?.(placeChapter.city);
        location.textContent = town ? `${town} · ${place}` : place;
        title.textContent = titleText;
        dialogueFocus(title);
    }

    function dialogueFocus(target) {
        dialog.scrollTop = 0;
        target.focus({ preventScroll: true });
    }

    function sceneBody(scene, speakerName, prose, actions, { phase = 'reading', clue, sprite, tone, step } = {}) {
        body.dataset.chapterPhase = phase;
        if (tone) body.dataset.chapterTone = tone;
        else delete body.dataset.chapterTone;
        pageProgress.hidden = !step;
        if (step) {
            pageProgress.max = step.total;
            pageProgress.value = step.current;
        }
        const stage = element('div', 'story-chapter-stage');
        const speakerSprite = sprite || (speakerName === scene.speaker?.name ? scene.speaker?.sprite : null);
        if (speakerSprite && phase !== 'discovery') {
            const portrait = element('img', 'story-chapter-portrait');
            portrait.src = new URL(`../../sprites/trainers/${speakerSprite}.png`, import.meta.url).href;
            portrait.alt = '';
            portrait.addEventListener('error', () => portrait.remove(), { once: true });
            stage.append(portrait);
        }
        const copy = element('div', 'story-chapter-copy');
        const person = [speakerName, speakerName === scene.speaker?.name ? scene.speaker?.role : ''].filter(Boolean).join(' · ');
        if (phase === 'discovery') copy.append(element('p', 'story-chapter-eyebrow', 'Hidden discovery'));
        else if (person) copy.append(element('p', 'story-chapter-eyebrow', person));
        const caption = element('p', 'story-chapter-caption', prose);
        caption.tabIndex = -1;
        copy.append(caption);
        if (clue) {
            const record = element('div', 'story-chapter-evidence');
            record.append(
                element('p', 'story-chapter-eyebrow', 'Filed in the Field Archive'),
                element('p', 'story-chapter-evidence-text', clue),
            );
            copy.append(record);
        }
        stage.append(copy);
        body.replaceChildren(stage, actions);
        return caption;
    }

    function openScene(chapter, { saved, fromArchive, readOnly, replayChoices, archiveKey }) {
        show(chapter.title, chapter.place, chapter.art);
        const panels = [...chapter.panels];
        const choices = fromArchive ? null : snapshot().choices;
        const echo = (chapter.echoes || []).find(entry =>
            (fromArchive ? replayChoices?.[entry.from] : choices[choiceKey(entry.from)]) === entry.choice);
        if (echo) panels.push({ speaker: chapter.speaker?.name, text: echo.text });
        const back = () => fromArchive ? openArchive(archiveKey) : dialog.close();
        const returnLabel = fromArchive ? 'Back to Field Archive' : (city === null ? 'Return to the Crucible' : 'Return to town');
        const done = () => button(returnLabel, 'done', '', back, true);
        const endScene = option => {
            const actions = element('div', 'story-chapter-actions');
            const current = readOnly ? null : snapshot().choices;
            const found = current?.[secretKey(chapter.id)] === true;
            if (current && hasTrail(chapter, chapters, current)) {
                actions.append(button(found ? 'Read the discovery' : 'Compare the records', 'secret', chapter.id, () => {
                    if (!found && !commit(secretKey(chapter.id), true)) {
                        actions.querySelector('[role="alert"]').textContent = 'Could not save the discovery. Try again.';
                        return;
                    }
                    if (!found) sound('shing', 0.32);
                    const footer = element('div', 'story-chapter-actions');
                    footer.append(done());
                    show(chapter.secret.title, chapter.place, chapter.art);
                    const caption = sceneBody(chapter, chapter.speaker.name, chapter.secret.text, footer, { phase: 'discovery' });
                    dialogueFocus(caption);
                }));
                const status = element('p', 'story-chapter-status');
                status.setAttribute('role', 'alert');
                actions.append(status);
            } else if (!readOnly && option.clue) {
                const hint = element('details', 'story-chapter-hint');
                hint.append(element('summary', '', 'Follow the trail'), element('p', '', chapter.secret.hint));
                actions.append(hint);
            }
            actions.append(done());
            const caption = sceneBody(chapter, chapter.speaker?.name, option.reply, actions, { phase: 'result', clue: option.clue });
            dialogueFocus(caption);
        };
        const showChoices = (entry, presentation) => {
            const actions = element('div', 'story-chapter-actions');
            const status = element('p', 'story-chapter-status');
            status.setAttribute('role', 'alert');
            for (const option of chapter.choices) {
                actions.append(button(option.label, 'pick', option.id, () => {
                    if (commit(choiceKey(chapter.id), option.id)) endScene(option);
                    else status.textContent = 'Could not save your choice. Try again.';
                }));
            }
            actions.append(status);
            dialogueFocus(sceneBody(chapter, entry.speaker || 'Narrator', entry.text, actions, { ...presentation, phase: 'choice' }));
        };
        const panel = index => {
            const entry = panels[index];
            const last = index + 1 === panels.length;
            const presentation = { sprite: entry.sprite, tone: entry.tone, step: { current: index + 1, total: panels.length } };
            if (chapter.id === 'chapter-7' && !readOnly) {
                if (index === 0) stopRelayMotif = globalThis.AudioSystem?.playStoryMotif?.('relay');
                else {
                    stopRelayMotif?.();
                    stopRelayMotif = null;
                }
            }
            sound(entry.cue, 0.26);
            if (last && chapter.choices && !saved) {
                showChoices(entry, presentation);
                return;
            }
            const footer = element('div', 'story-chapter-actions');
            if (last && !chapter.choices) footer.append(done());
            else footer.append(button('Continue', 'next', '', () => last ? endScene(saved) : panel(index + 1), true));
            dialogueFocus(sceneBody(chapter, entry.speaker || 'Narrator', entry.text, footer, presentation));
        };
        if (saved && !readOnly) endScene(saved);
        else panel(0);
    }

    function openKeepsake(item, fromArchive) {
        show(item.title, 'Field keepsake');
        const footer = element('div', 'story-chapter-actions');
        footer.append(button(fromArchive ? 'Back to Field Archive' : 'Return to the Crucible', 'done', '',
            () => fromArchive ? openArchive(`keepsake/${item.id}`) : dialog.close(), true));
        const caption = sceneBody(item, '', item.note, footer, { phase: 'keepsake' });
        const illustration = element('img', 'story-archive-keepsake-art');
        illustration.alt = '';
        illustration.width = 192;
        illustration.height = 96;
        illustration.src = new URL(`../../sprites/backgrounds/story/${item.art}`, import.meta.url).href;
        illustration.addEventListener('error', () => illustration.remove(), { once: true });
        body.querySelector('.story-chapter-copy').prepend(illustration);
        dialogueFocus(caption);
    }

    function openArchive(focusKey) {
        show('Field Archive', 'The Open Circle');
        delete body.dataset.chapterPhase;
        delete body.dataset.chapterTone;
        pageProgress.hidden = true;
        const { archive } = snapshot(false);
        const summary = progress.summarize(archive);
        const discoveries = summary.distinctSecrets === 1 ? 'discovery' : 'discoveries';
        const intro = element('p', 'story-archive-count', `${summary.distinctChapters} of ${chapters.length} scenes · ${summary.distinctSecrets} hidden ${discoveries}`);
        const scenes = element('div', 'story-archive-scenes');
        const records = Object.values(archive.runs);
        let focus;
        const identify = (entry, key) => {
            if (key === focusKey) focus = entry;
            return entry;
        };
        for (const chapter of chapters) {
            const seen = new Set(records.map(record => record.choices[chapter.id]));
            const options = chapter.choices.filter(option => seen.has(option.id));
            if (!options.length) continue;
            const entry = element('section', 'story-archive-entry');
            entry.append(element('h3', '', chapter.title));
            for (const option of options) {
                const record = records.find(run => run.choices[chapter.id] === option.id);
                const archiveKey = `scene/${chapter.id}/${option.id}`;
                entry.append(identify(button(option.label, 'replay', chapter.id, () => openScene(chapter, {
                    saved: option, fromArchive: true, readOnly: true, replayChoices: record?.choices, archiveKey,
                })), archiveKey));
                if (option.clue) entry.append(element('p', 'story-chapter-clue', option.clue));
            }
            if (records.some(record => record.secrets[chapter.id])) {
                const archiveKey = `discovery/${chapter.id}`;
                entry.append(identify(button(`Read discovery · ${chapter.secret.title}`, 'replay-secret', chapter.id, () => {
                    show(chapter.secret.title, chapter.place, chapter.art);
                    const footer = element('div', 'story-chapter-actions');
                    footer.append(button('Back to Field Archive', 'done', '', () => openArchive(archiveKey), true));
                    dialogueFocus(sceneBody(chapter, chapter.speaker.name, chapter.secret.text, footer, { phase: 'discovery' }));
                }), archiveKey));
            }
            scenes.append(entry);
        }
        if (!scenes.children.length) {
            scenes.append(element('p', '', 'Talk to a witness to open your first record.'));
        }
        const rewards = element('section', 'story-archive-entry');
        rewards.append(element('h3', '', 'Archive rewards'));
        for (const milestone of summary.milestones) {
            const note = element('p', 'story-archive-milestone', `${milestone.earned ? 'Earned · ' : ''}${milestone.title} — ${milestone.description}`);
            rewards.append(note);
        }
        for (const scene of summary.replayScenes) {
            const archiveKey = `reward/${scene.id}`;
            rewards.append(identify(button(scene.title, 'reward', scene.id,
                () => openScene(scene, { fromArchive: true, readOnly: true, archiveKey }), true), archiveKey));
        }
        const sections = [intro, scenes, rewards];
        if (summary.keepsakes.length) {
            const keepsakes = element('section', 'story-archive-entry');
            keepsakes.append(element('h3', '', 'Field keepsakes'));
            for (const item of summary.keepsakes) {
                const archiveKey = `keepsake/${item.id}`;
                keepsakes.append(identify(button(`Inspect · ${item.title}`, 'keepsake', item.id,
                    () => openKeepsake(item, true)), archiveKey));
            }
            sections.push(keepsakes);
        }
        body.replaceChildren(...sections);
        if (focus) focus.focus();
        else dialogueFocus(title);
    }

    snapshot();
    updateCard();
}
