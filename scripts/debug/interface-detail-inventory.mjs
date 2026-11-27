#!/usr/bin/env node
// Inventory presentational details and candidate dynamic authors. Does not execute game scripts.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { Linter } from 'eslint';
import { JSDOM } from 'jsdom';

const root = fileURLToPath(new URL('../../', import.meta.url));
const { values } = parseArgs({ options: { observations: { type: 'string' } } });
const read = file => readFileSync(resolve(root, file), 'utf8');
const documents = ['index.html', 'battle.html', 'competitive/index.html'];
const excludedBundles = new Set([
    'competitive/classic-simulation.js', 'competitive/showdown-engine.js', 'competitive/showdown-worker.js',
]);
const interactive = 'button, a[href], input:not([type="hidden"]), select, textarea, summary, [tabindex], [role="button"], [role="tab"], [role="radio"], [role="switch"]';
const nameAttributes = ['aria-label', 'aria-labelledby', 'title', 'alt', 'placeholder'];
const surface = '.screen[id], .modal[id], dialog, [role="dialog"], [role="tabpanel"]';
const clean = text => String(text || '').trim().replace(/\s+/g, ' ').slice(0, 500);
const marker = node => node.id || node.getAttribute('aria-label') || node.classList[0] || node.localName;
const linter = new Linter();

function propertyName(member) {
    if (member?.type !== 'MemberExpression') return '';
    return member.computed ? member.property.value : member.property.name;
}

function sourceSites(code, file, lineOffset, sourceType) {
    const messages = linter.verify(code, { parserOptions: { ecmaVersion: 'latest', sourceType } });
    if (messages.some(message => message.fatal)) throw new Error(`${file}: ${messages[0].message}`);
    const { ast, visitorKeys } = linter.getSourceCode();
    const pending = [ast];
    const sites = [];
    while (pending.length) {
        const node = pending.pop();
        let operation;
        let detail;
        if (node.type === 'TemplateLiteral') {
            const tags = node.quasis.flatMap(part => [...part.value.raw.matchAll(/<([a-z][\w-]*)\b/gi)].map(match => match[1]));
            if (tags.length) {
                operation = 'markup template';
                detail = tags;
            }
        } else if (node.type === 'AssignmentExpression') {
            const field = propertyName(node.left);
            if (['innerHTML', 'outerHTML', 'innerText', 'textContent', 'ariaLabel', 'className'].includes(field)) {
                operation = 'DOM write';
                detail = field;
            }
        } else if (node.type === 'CallExpression') {
            const method = propertyName(node.callee) || node.callee.name;
            if (['createElement', 'insertAdjacentHTML', 'replaceChildren', 'element', 'button'].includes(method)) {
                operation = 'DOM constructor or replacement';
                detail = method;
            } else if (method === 'setAttribute' && nameAttributes.includes(node.arguments[0]?.value)) {
                operation = 'label write';
                detail = node.arguments[0].value;
            }
        }
        if (operation) sites.push({ path: file, line: node.loc.start.line + lineOffset, operation, detail });
        for (const key of visitorKeys[node.type] || []) {
            const value = node[key];
            if (Array.isArray(value)) pending.push(...value.filter(child => child?.type));
            else if (value?.type) pending.push(value);
        }
    }
    return sites.reverse();
}

const sourceElements = [];
const dynamicSites = [];
for (const file of documents) {
    const dom = new JSDOM(read(file), { includeNodeLocations: true });
    const { document } = dom.window;
    for (const node of document.querySelectorAll('body *')) {
        const location = dom.nodeLocation(node);
        if (!location || node.closest('script, style')) continue;
        const attributes = Object.fromEntries(nameAttributes.flatMap(name => {
            const value = node.getAttribute(name);
            return value === null ? [] : [[name, clean(value)]];
        }));
        const control = node.matches(interactive);
        const text = clean(control ? node.textContent : [...node.childNodes]
            .filter(child => child.nodeType === dom.window.Node.TEXT_NODE).map(child => child.textContent).join(' '));
        const scope = node.closest(surface);
        sourceElements.push({ path: file, line: location.startLine, column: location.startCol, tag: node.localName,
            surface: scope ? marker(scope) : 'page', id: node.id || null, control, text, attributes });
    }
    for (const node of document.querySelectorAll('script:not([src])')) {
        if (node.type && node.type !== 'module' && node.type !== 'text/javascript') continue;
        const origin = dom.nodeLocation(node).startTag.endLine - 1;
        dynamicSites.push(...sourceSites(node.textContent, file, origin, node.type === 'module' ? 'module' : 'script'));
    }
    dom.window.close();
}

const manifest = JSON.parse(read('offline-assets.json'));
const scripts = manifest.files.map(entry => decodeURI(entry.u)).filter(file =>
    file.endsWith('.js') && !file.startsWith('vendor/') && !excludedBundles.has(file));
for (const file of scripts) dynamicSites.push(...sourceSites(read(file), file, 0, 'module'));

const observedControls = new Map();
const observations = values.observations ? read(values.observations).split(/\r?\n/).filter(Boolean).map(JSON.parse) : [];
for (const row of observations) {
    for (const control of row.controls || []) {
        const identity = JSON.stringify([control.surface, control.type, control.key, control.label]);
        const tracked = observedControls.get(identity) || { surface: control.surface, type: control.type, key: control.key,
            label: control.label, firstCapture: row.capture, observations: 0, enabledObservations: 0 };
        tracked.observations++;
        if (!control.disabled) tracked.enabledObservations++;
        observedControls.set(identity, tracked);
    }
}

const report = {
    assetDigest: manifest.digest,
    documents,
    scripts,
    sourceElements,
    dynamicSites,
    observations: observations.length,
    observationErrors: observations.filter(row => row.error).map(row => ({ capture: row.capture, error: row.error })),
    observedControls: [...observedControls.values()],
};
console.log(JSON.stringify(report, null, 2));
