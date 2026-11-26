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
// Brief excerpts from the original film's English dub. See the writing references.
const screeningExcerpts = [
    ['Meowth', 'We do have a lot in common.'],
    ['Mewtwo', 'It is what you do with the gift of life that determines who you are.'],
];
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

function matchingEchoes(chapter, readChoice) {
    return (chapter.echoes || []).filter(echo => readChoice(echo.from) === echo.choice);
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
    if (!host.isConnected || !bridge.isCurrent()) return false;
    const here = chapters.find(chapter => chapter.city === city);
    if (!here) return false;

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
    const eyebrow = city === 1 ? element('p', 'story-chapter-eyebrow', 'Optional story') : null;
    const teaser = element('p', 'story-chapter-teaser', here.invitation);
    card.setAttribute('aria-label', here.title);
    const open = button(here.title, 'open', here.id, () => {
        origin = open;
        const saved = chosen(here, snapshot().choices);
        openScene(here, { saved, fromArchive: false, readOnly: false });
    }, true);
    if (eyebrow) invitation.append(eyebrow);
    invitation.append(open, teaser);
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
        const option = chosen(here, choices);
        open.textContent = option ? `Read ${here.title}` : here.title;
        if (option) open.setAttribute('aria-label', `Read ${here.title} again`);
        else open.removeAttribute('aria-label');
        if (eyebrow) eyebrow.hidden = Boolean(option);
        teaser.textContent = option ? option.townNote || '' : here.invitation;
        teaser.hidden = !teaser.textContent;
        if (option && here.secret.requires.length && !choices[secretKey(here.id)] && hasTrail(here, chapters, choices)) {
            bridge.notice?.(`records:${here.id}`, `Two records match. Reopen ${here.title} to compare them.`);
        }
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
    let stopDialogue;
    let backWithinDialog;
    function show(titleText, place, art) {
        stopDialogue?.();
        stopDialogue = null;
        stopRelayMotif?.();
        stopRelayMotif = null;
        backWithinDialog = null;
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
            const dismiss = () => backWithinDialog ? backWithinDialog() : opened.close();
            const release = globalThis._registerAppDialog?.(opened, dismiss);
            opened.addEventListener('cancel', event => {
                if (!backWithinDialog) return;
                event.preventDefault();
                backWithinDialog();
            });
            opened.addEventListener('close', () => {
                opened.remove();
                release?.();
                if (dialog !== opened) return;
                stopDialogue?.();
                stopDialogue = null;
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
        location.textContent = place || '';
        location.hidden = !location.textContent;
        title.textContent = titleText;
        dialogueFocus(title);
    }

    function dialogueFocus(target) {
        dialog.scrollTop = 0;
        target.focus({ preventScroll: true });
    }

    function sceneBody(scene, speakerName, prose, actions, { phase = 'reading', clue, sprite, tone, step, source, savedAnswer, records } = {}) {
        stopDialogue?.();
        stopDialogue = null;
        body.dataset.chapterPhase = phase;
        if (tone) body.dataset.chapterTone = tone;
        else delete body.dataset.chapterTone;
        const recording = tone === 'recording';
        const spoken = Boolean(speakerName) && speakerName !== 'Narrator'
            && (phase === 'reading' || phase === 'choice') && !recording;
        body.dataset.chapterRegister = recording ? 'recording' : spoken ? 'speech' : 'narration';
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
        const label = source ? `From ${source}` : recording ? (speakerName || 'Recording') : spoken ? speakerName : '';
        if (label) copy.append(element('p', 'story-chapter-eyebrow', label));
        const caption = element(spoken ? 'blockquote' : 'p', 'story-chapter-caption', prose);
        caption.tabIndex = -1;
        copy.append(caption);
        if (savedAnswer) copy.append(element('p', 'story-chapter-replay-answer', `You chose “${savedAnswer}.”`));
        if (clue) {
            const record = element('div', 'story-chapter-evidence');
            record.append(
                element('p', 'story-chapter-eyebrow', 'Clue saved'),
                element('p', 'story-chapter-evidence-text', clue),
            );
            copy.append(record);
        }
        if (records?.length) {
            const comparison = element('dl', 'story-chapter-records');
            for (const record of records) {
                const evidence = element('div', 'story-chapter-evidence');
                evidence.append(element('dt', 'story-chapter-eyebrow', record.title),
                    element('dd', 'story-chapter-evidence-text', record.clue));
                comparison.append(evidence);
            }
            copy.append(comparison);
        }
        stage.append(copy);
        body.replaceChildren(stage, actions);
        return caption;
    }

    function openScene(chapter, { saved, fromArchive, readOnly, replayChoices, archiveKey, onBack }) {
        show(chapter.title, chapter.place, chapter.art);
        const panels = [...chapter.panels];
        const choices = readOnly ? replayChoices || {} : snapshot(false).choices;
        const readChoice = id => choices[readOnly ? id : choiceKey(id)];
        for (const echo of matchingEchoes(chapter, readChoice)) {
            panels.push({ text: echo.text, source: chapters.find(entry => entry.id === echo.from)?.title });
        }
        const back = onBack || (() => fromArchive ? openArchive(archiveKey) : dialog.close());
        if (onBack || fromArchive) backWithinDialog = back;
        const returnLabel = fromArchive ? 'Back to archive' : onBack ? 'Back to outcome'
            : (city === null ? 'Back to the Crucible' : 'Back to town');
        const done = () => button(returnLabel, 'done', '', back, true);
        const endScene = option => {
            const actions = element('div', 'story-chapter-actions');
            const current = readOnly ? null : snapshot(false).choices;
            const found = current?.[secretKey(chapter.id)] === true;
            if (current && hasTrail(chapter, chapters, current)) {
                actions.append(button(found ? 'Read discovery' : 'Compare records', 'secret', chapter.id, () => {
                    if (!found && !commit(secretKey(chapter.id), true)) {
                        actions.querySelector('[role="alert"]').textContent = 'Could not save the discovery. Try again.';
                        return;
                    }
                    if (!found) sound('shing', 0.32);
                    const restoreOutcome = () => {
                        show(chapter.title, chapter.place, chapter.art);
                        endScene(option);
                        body.querySelector('[data-adventure-secret]')?.focus({ preventScroll: true });
                    };
                    const footer = element('div', 'story-chapter-actions');
                    footer.append(button('Back to outcome', 'result', '', restoreOutcome), done());
                    show(chapter.secret.title, chapter.place, chapter.art);
                    backWithinDialog = restoreOutcome;
                    const records = [...chapter.secret.requires, chapter.id].map(id => {
                        const source = chapters.find(entry => entry.id === id);
                        return { title: source.title, clue: chosen(source, current).clue };
                    });
                    const caption = sceneBody(chapter, chapter.speaker.name, chapter.secret.text, footer, { phase: 'discovery', records });
                    dialogueFocus(caption);
                }));
                const status = element('p', 'story-chapter-status');
                status.setAttribute('role', 'alert');
                actions.append(status);
            } else if (!readOnly && option.clue) {
                const hint = element('details', 'story-chapter-hint');
                hint.append(element('summary', '', 'Clue hint'), element('p', '', chapter.secret.hint));
                actions.append(hint);
            }
            if (option.consequence) {
                const receipt = element('details', 'story-chapter-hint');
                receipt.append(element('summary', '', 'What changed'), element('p', '', option.consequence));
                actions.append(receipt);
            }
            if (current) {
                actions.append(button('Read full scene', 'read', chapter.id, () => openScene(chapter, {
                    saved: option,
                    readOnly: true,
                    replayChoices: Object.fromEntries(chapters.map(entry => [entry.id, current[choiceKey(entry.id)]])),
                    onBack: () => {
                        show(chapter.title, chapter.place, chapter.art);
                        endScene(option);
                        body.querySelector('[data-adventure-read]')?.focus();
                    },
                })));
            }
            actions.append(done());
            const caption = sceneBody(chapter, chapter.speaker?.name, option.reply, actions, {
                phase: 'result', clue: option.clue, savedAnswer: readOnly ? option.label : null,
            });
            dialogueFocus(caption);
        };
        const showChoices = (entry, presentation) => {
            const actions = element('div', 'story-chapter-actions');
            actions.setAttribute('role', 'group');
            actions.setAttribute('aria-label', chapter.city === null ? 'How should Ivo’s account be kept?' : 'What do you do?');
            const status = element('p', 'story-chapter-status');
            status.setAttribute('role', 'alert');
            for (const option of chapter.choices) {
                const choice = button(option.label, 'pick', option.id, () => {
                    const controls = [...actions.querySelectorAll('button')];
                    controls.forEach(control => { control.disabled = true; });
                    if (commit(choiceKey(chapter.id), option.id)) endScene(option);
                    else {
                        controls.forEach(control => { control.disabled = false; });
                        choice.focus();
                        status.textContent = 'Could not save your choice. Try again.';
                    }
                });
                if (option.detail) choice.append(element('span', 'story-chapter-choice-detail', option.detail));
                actions.append(choice);
            }
            actions.append(status);
            dialogueFocus(sceneBody(chapter, entry.speaker, entry.text, actions, { ...presentation, phase: 'choice' }));
        };
        const panel = index => {
            const entry = panels[index];
            const last = index + 1 === panels.length;
            const presentation = { sprite: entry.sprite, tone: entry.tone, source: entry.source, step: { current: index + 1, total: panels.length } };
            if (chapter.id === 'chapter-7' && !readOnly) {
                if (index === 0) stopRelayMotif = globalThis.AudioSystem?.playStoryMotif?.('relay');
                else {
                    stopRelayMotif?.();
                    stopRelayMotif = null;
                }
            }
            if (!readOnly) sound(entry.cue, 0.26);
            if (last && chapter.choices && !saved) {
                showChoices(entry, presentation);
            } else {
                const footer = element('div', 'story-chapter-actions');
                if (last && !chapter.choices) footer.append(done());
                else footer.append(button('Continue', 'next', '', () => last ? endScene(saved) : panel(index + 1), true));
                dialogueFocus(sceneBody(chapter, entry.speaker, entry.text, footer, presentation));
            }
            if (entry.voiceId && !readOnly) {
                stopDialogue = globalThis.AudioSystem?.playDialogue?.(entry.voiceId, entry.text);
            }
        };
        if (saved && !readOnly) endScene(saved);
        else panel(0);
    }

    function openKeepsake(item, fromArchive) {
        show(item.title, 'Field keepsake');
        const back = () => fromArchive ? openArchive(`keepsake/${item.id}`) : dialog.close();
        if (fromArchive) backWithinDialog = back;
        const footer = element('div', 'story-chapter-actions');
        footer.append(button(fromArchive ? 'Back to archive' : 'Back to the Crucible', 'done', '', back, true));
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

    function openRecordedJourney(chapter, option, variants, archiveKey) {
        const replay = ({ record }) => openScene(chapter, {
            saved: option, fromArchive: true, readOnly: true, replayChoices: record.choices, archiveKey,
        });
        if (variants.length === 1) {
            replay(variants[0]);
            return;
        }
        show(chapter.title, 'Recorded journeys', chapter.art);
        delete body.dataset.chapterPhase;
        delete body.dataset.chapterRegister;
        delete body.dataset.chapterTone;
        pageProgress.hidden = true;
        backWithinDialog = () => openArchive(archiveKey);
        const list = element('div', 'story-archive-entry');
        list.append(element('p', 'story-chapter-replay-answer', `You chose “${option.label}.”`));
        for (const variant of variants) {
            const context = variant.echoes.map(echo => {
                const earlier = chapters.find(entry => entry.id === echo.from);
                return earlier?.choices.find(choice => choice.id === echo.choice)?.label;
            }).filter(Boolean);
            const control = button(`Replay journey ${variant.number}`, 'replay-journey', chapter.id, () => replay(variant));
            if (context.length) control.append(element('span', 'story-chapter-choice-detail', context.join(' · ')));
            list.append(control);
        }
        list.append(button('Back to archive', 'done', '', backWithinDialog, true));
        body.replaceChildren(list);
        dialogueFocus(title);
    }

    function openArchive(focusKey) {
        show('Field Archive');
        delete body.dataset.chapterPhase;
        delete body.dataset.chapterTone;
        delete body.dataset.chapterRegister;
        pageProgress.hidden = true;
        const { archive } = snapshot(false);
        const summary = progress.summarize(archive);
        const discoveries = summary.distinctSecrets === 1 ? 'discovery' : 'discoveries';
        const counts = [`${summary.distinctChapters} of ${chapters.length} scenes`];
        if (summary.distinctSecrets) counts.push(`${summary.distinctSecrets} ${discoveries}`);
        const intro = element('p', 'story-archive-count', counts.join(' · '));
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
                const variants = new Map();
                records.forEach((record, index) => {
                    if (record.choices[chapter.id] !== option.id) return;
                    const echoes = matchingEchoes(chapter, id => record.choices[id]);
                    const key = JSON.stringify(echoes.map(echo => [echo.from, echo.choice]));
                    if (!variants.has(key)) variants.set(key, { record, echoes, number: index + 1 });
                });
                const archiveKey = `scene/${chapter.id}/${option.id}`;
                const replay = button(option.label, 'replay', chapter.id,
                    () => openRecordedJourney(chapter, option, [...variants.values()], archiveKey));
                if (variants.size > 1) replay.append(element('span', 'story-chapter-choice-detail', `${variants.size} recorded journeys`));
                entry.append(identify(replay, archiveKey));
            }
            const clues = options.filter(option => option.clue);
            if (clues.length) {
                const notes = element('details', 'story-chapter-hint story-archive-notes');
                notes.append(element('summary', '', 'Clues'));
                for (const option of clues) notes.append(element('p', 'story-chapter-clue', option.clue));
                entry.append(notes);
            }
            if (records.some(record => record.secrets[chapter.id])) {
                const archiveKey = `discovery/${chapter.id}`;
                entry.append(identify(button(chapter.secret.title, 'replay-secret', chapter.id, () => {
                    show(chapter.secret.title, chapter.place, chapter.art);
                    backWithinDialog = () => openArchive(archiveKey);
                    const footer = element('div', 'story-chapter-actions');
                    footer.append(button('Back to archive', 'done', '', backWithinDialog, true));
                    dialogueFocus(sceneBody(chapter, chapter.speaker.name, chapter.secret.text, footer, { phase: 'discovery' }));
                }), archiveKey));
            }
            scenes.append(entry);
        }
        if (!scenes.children.length) {
            scenes.append(element('p', '', 'Talk to a witness to open your first record.'));
        }
        const rewards = element('section', 'story-archive-entry');
        const checklist = element('details', 'story-chapter-hint story-archive-notes');
        checklist.append(element('summary', '', 'Archive rewards'));
        for (const milestone of summary.milestones) {
            const note = element('p', 'story-archive-milestone');
            note.append(element('strong', '', milestone.earned ? `${milestone.title} ✓` : milestone.title));
            note.append(document.createTextNode(` · ${milestone.description}`));
            checklist.append(note);
        }
        rewards.append(checklist);
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
                keepsakes.append(identify(button(item.title, 'keepsake', item.id,
                    () => openKeepsake(item, true)), archiveKey));
            }
            sections.push(keepsakes);
        }
        if (summary.distinctChapters) {
            const screening = element('details', 'story-archive-entry story-archive-screening');
            screening.append(element('summary', '', 'Old screening'),
                element('p', 'story-archive-screening-source', 'Pokémon: The First Movie · English dub'));
            for (const [speaker, line] of screeningExcerpts) {
                const figure = element('figure', '');
                figure.append(element('blockquote', '', line), element('figcaption', '', speaker));
                screening.append(figure);
            }
            sections.push(screening);
        }
        body.replaceChildren(...sections);
        if (focus) focus.focus();
        else dialogueFocus(title);
    }

    snapshot();
    updateCard();
    return true;
}
