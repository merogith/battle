/* Stage effects consume resolved events. This file never reads battle state or RNG. */
(function () {
    'use strict';

    const PI = Math.PI;
    const IMPACT_PRIORITY = { effect: 1, charge: 2, fail: 3, miss: 3, heal: 4, immune: 5, block: 5, hit: 6, decoy: 6 };
    const clamp = (value, floor, ceiling) => Math.max(floor, Math.min(ceiling, value));
    const mix = (a, b, fraction) => a + (b - a) * fraction;
    const point = (a, b, fraction) => ({ x: mix(a.x, b.x, fraction), y: mix(a.y, b.y, fraction) });
    const sideFor = value => /^(p[12])(?:[a-z]?: |$)/.exec(value || '')?.[1];

    function impactFor(event, targetSide, category) {
        const [, , subject, detail, extra] = (event.protocol || '').split('|');
        switch (event.tag) {
        case '-miss': return 'miss';
        case '-immune': return 'immune';
        case '-fail': case '-notarget': return 'fail';
        case '-prepare': return 'charge';
        case '-block': return 'block';
        case '-damage':
            if (event.side !== targetSide || extra?.startsWith('[from]')) return null;
            return category === 'Status' ? 'effect' : 'hit';
        case '-heal': return event.side === targetSide ? 'heal' : null;
        case '-activate':
            if (event.side !== targetSide) return null;
            if (detail === 'move: Substitute' && extra === '[damage]') return 'decoy';
            if (/^move: (Protect|Detect|Spiky Shield|King’s Shield|King's Shield|Baneful Bunker|Obstruct|Silk Trap|Burning Bulwark|Mat Block|Crafty Shield|Max Guard|Wide Guard|Quick Guard)$/.test(detail)) return 'block';
            break;
        case '-start':
            if (event.side === targetSide && detail === 'Substitute') return 'effect';
            break;
        case '-status': case '-boost': case '-unboost': case '-curestatus':
            return event.side === targetSide ? 'effect' : null;
        case '-sidestart':
            return sideFor(subject) === targetSide ? 'effect' : null;
        case '-fieldstart': case '-weather': return 'effect';
        }
        return null;
    }

    function analyzeMove(events, targetSide, category) {
        const hitIndices = [];
        let outcome = category === 'Status' ? 'effect' : 'travel';
        let index = 0;
        let priority = 0;
        for (const [position, event] of events.entries()) {
            const result = impactFor(event, targetSide, category);
            if (result === 'hit' || result === 'decoy') hitIndices.push(position);
            // A status move can pay HP after its other effects. Show the entire
            // cost at contact without giving it the sound and pose of an attack.
            const hpCost = result === 'effect' && event.tag === '-damage';
            if (result && (IMPACT_PRIORITY[result] > priority || (hpCost && IMPACT_PRIORITY[result] === priority))) {
                outcome = result;
                index = position;
                priority = IMPACT_PRIORITY[result];
            }
        }
        return { outcome, index, hitIndices };
    }

    function metric(screen, canvas, fromElement, toElement, scope) {
        const rect = screen.getBoundingClientRect();
        if (!(rect.width > 1 && rect.height > 1)) return null;
        const anchor = (element, fallback) => {
            const bounds = element?.getBoundingClientRect();
            return bounds?.width > 0 && bounds?.height > 0 ? {
                x: bounds.left - rect.left + bounds.width / 2,
                y: bounds.top - rect.top + bounds.height * 0.47,
            } : fallback;
        };
        const dpr = Math.min(1.6, window.devicePixelRatio || 1);
        const width = Math.round(rect.width * dpr);
        const height = Math.round(rect.height * dpr);
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
        }
        const from = anchor(fromElement, { x: rect.width * 0.30, y: rect.height * 0.58 });
        const to = anchor(toElement, { x: rect.width * 0.68, y: rect.height * 0.32 });
        const size = clamp(Math.min(rect.width, rect.height) * 0.045, 10, 21);
        if (scope === 'field') {
            to.x = (from.x + to.x) / 2;
            to.y = (from.y + to.y) / 2 + size;
        } else if (scope === 'ally-side' || scope === 'foe-side') {
            to.y += size * 1.5;
        }
        return { dpr, width: rect.width, height: rect.height, from, to, size };
    }

    function trace(ctx, points, close = false) {
        ctx.beginPath();
        ctx.moveTo(...points[0]);
        for (const next of points.slice(1)) ctx.lineTo(...next);
        if (close) ctx.closePath();
    }

    function drawShape(ctx, shape, size, phase) {
        ctx.beginPath();
        switch (shape) {
        case 'ring': case 'wave':
            ctx.ellipse(0, 0, size, size * (shape === 'wave' ? 0.52 : 0.8), 0, 0, PI * 2);
            ctx.stroke();
            break;
        case 'slash':
            ctx.moveTo(-size, size * 0.6);
            ctx.quadraticCurveTo(-size * 0.18, -size, size, -size * 0.6);
            ctx.quadraticCurveTo(size * 0.10, -size * 0.25, -size, size * 0.6);
            ctx.fill();
            break;
        case 'shard':
            trace(ctx, [[-size, 0], [0, -size * 0.45], [size, 0], [0, size * 0.45]], true);
            ctx.fill();
            break;
        case 'spark':
            trace(ctx, [[-size, 0], [-size * 0.2, -size * 0.16], [0, -size], [size * 0.20, -size * 0.16], [size, 0], [size * 0.20, size * 0.17], [0, size], [-size * 0.20, size * 0.17]], true);
            ctx.fill();
            break;
        case 'bolt':
            trace(ctx, [[-size, size * 0.5], [-size * 0.28, -size * 0.15], [0, size * 0.18], [size, -size * 0.6]]);
            ctx.stroke();
            break;
        case 'cone':
            ctx.moveTo(-size, 0);
            ctx.quadraticCurveTo(size * .2, -size * .25, size, -size * .68);
            ctx.quadraticCurveTo(size * .42, 0, size, size * .68);
            ctx.quadraticCurveTo(size * .2, size * .25, -size, 0);
            ctx.fill();
            break;
        case 'line':
            trace(ctx, [[-size, 0], [size, 0]]);
            ctx.stroke();
            break;
        case 'seal':
            trace(ctx, Array.from({ length: 6 }, (_, index) => {
                const angle = index * PI / 3 + phase * 0.45;
                return [Math.cos(angle) * size, Math.sin(angle) * size];
            }), true);
            ctx.stroke();
            break;
        case 'petal':
            ctx.ellipse(0, 0, size, size * 0.36, PI * 0.22, 0, PI * 2);
            ctx.fill();
            break;
        case 'note':
            ctx.ellipse(-size * 0.24, size * 0.34, size * 0.35, size * 0.25, 0, 0, PI * 2);
            ctx.fill();
            trace(ctx, [[size * 0.09, size * 0.35], [size * 0.09, -size * 0.7], [size * 0.55, -size * 0.47]]);
            ctx.stroke();
            break;
        case 'dust':
            for (let index = 0; index < 4; index++) {
                ctx.moveTo(size * .56 - index * size * .39, size * .24);
                ctx.arc(size * .32 - index * size * .39, size * .24, size * (.24 + index * .07), 0, PI * 2);
            }
            ctx.fill();
            break;
        default: {
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
            gradient.addColorStop(0, ctx.strokeStyle);
            gradient.addColorStop(1, ctx.fillStyle);
            ctx.fillStyle = gradient;
            ctx.arc(0, 0, size, 0, PI * 2);
            ctx.fill();
        }
        }
    }

    function paint(ctx, shape, position, size, colors, opacity, rotation = 0, phase = 0) {
        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(rotation);
        ctx.fillStyle = colors[0];
        ctx.strokeStyle = colors[1];
        ctx.globalAlpha = clamp(opacity, 0, 1);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = clamp(size * 0.17, 1.4, 4);
        drawShape(ctx, shape, size, phase);
        ctx.restore();
    }

    function motionPoint(path, from, to, fraction, size, lane) {
        const p = point(from, to, fraction);
        const arch = Math.sin(fraction * PI);
        switch (path) {
        case 'arc': p.y -= arch * size * 2.6; break;
        case 'spiral': p.y += arch * Math.sin(fraction * PI * 4 + lane) * size * 1.35; break;
        case 'zigzag': p.y += arch * Math.sin(fraction * PI * 7 + lane) * size * 0.82; break;
        case 'fan': p.y += arch * lane * size * 0.75; break;
        case 'orbit': p.x += Math.sin(fraction * PI * 3 + lane) * arch * size; p.y -= arch * size; break;
        case 'ground': p.y += arch * size * 1.72; break;
        case 'drop': p.x = to.x + lane * size * .35; p.y = to.y - (1 - fraction) * size * 5; break;
        case 'pulse': p.y += arch * Math.sin(lane) * size * 0.6; break;
        }
        return p;
    }

    function drawApproach(ctx, profile, geometry, value, windupFraction, outcome) {
        const { from, to, size } = geometry;
        const { color, family, shape, path } = profile;
        if (outcome === 'fail') {
            paint(ctx, 'spark', from, size * mix(.36, .16, value), color, .62 * (1 - value), 0, value);
            return;
        }
        if (value < windupFraction || outcome === 'charge') {
            const progress = Math.min(1, value / Math.max(0.1, windupFraction));
            if (family !== 'contact') paint(ctx, outcome === 'charge' ? 'seal' : shape, path === 'drop' ? to : from,
                size * mix(0.20, 0.65, progress), color, progress * 0.82, 0, progress);
            return;
        }
        const progress = clamp((value - windupFraction) / (1 - windupFraction), 0, 1);
        const target = outcome === 'miss'
            ? { x: to.x + (to.x === from.x ? size : Math.sign(to.x - from.x) * size * 1.7), y: to.y - size * 1.25 }
            : to;
        const angle = Math.atan2(target.y - from.y, target.x - from.x);
        if (shape === 'bolt' && path === 'drop') {
            const top = { x: target.x - size * .6, y: Math.max(0, target.y - size * 5) };
            const right = { x: target.x + size * .44, y: mix(top.y, target.y, .35) };
            const left = { x: target.x - size * .68, y: mix(top.y, target.y, .62) };
            const end = point(top, target, progress);
            const branch = progress > .65 ? [[right.x, right.y], [left.x, left.y]] : progress > .38 ? [[right.x, right.y]] : [];
            ctx.save();
            ctx.globalAlpha = Math.min(.94, .32 + progress);
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            trace(ctx, [[top.x, top.y], ...branch, [end.x, end.y]]);
            ctx.strokeStyle = color[0];
            ctx.lineWidth = size * .31;
            ctx.stroke();
            ctx.strokeStyle = color[1];
            ctx.lineWidth = size * .11;
            ctx.stroke();
            ctx.restore();
            return;
        }
        if (family === 'beam' && path !== 'drop') {
            const head = point(from, target, progress);
            ctx.save();
            ctx.lineCap = 'round';
            ctx.globalAlpha = .75;
            ctx.lineWidth = size * (shape === 'cone' ? .8 : .5);
            ctx.strokeStyle = color[0];
            trace(ctx, [[from.x, from.y], [head.x, head.y]]);
            ctx.stroke();
            ctx.lineWidth *= .36;
            ctx.strokeStyle = color[1];
            ctx.stroke();
            ctx.restore();
        }
        if (family === 'contact' && shape === 'orb') {
            const p = point(from, target, Math.max(0, progress - 0.20));
            paint(ctx, 'dust', p, size * .65, color, progress * 0.32, angle);
            return;
        }
        const count = clamp(profile.count || 1, 1, geometry.width < 480 ? 4 : 7);
        for (let index = 0; index < count; index++) {
            const lane = index - (count - 1) / 2;
            const position = motionPoint(path, from, target, clamp(progress - index * 0.055, 0, 1), size, lane);
            const scale = (shape === 'wave' || shape === 'ring' || shape === 'cone') ? mix(.42, 1.5, progress) : 1;
            paint(ctx, shape, position, size * scale * (1 - index * .10), color, mix(.8, .38, index / count),
                (path === 'drop' ? PI * .5 : angle) + lane * .08, progress);
        }
    }

    function drawImpact(ctx, profile, geometry, value, outcome) {
        if (['miss', 'fail', 'travel', 'charge'].includes(outcome)) return;
        const { to, size, width, from } = geometry;
        const refused = ['block', 'immune', 'decoy'].includes(outcome);
        const colors = refused ? ['#9db6db', '#eef4ff'] : profile.color;
        const shape = outcome === 'block' ? 'seal' : outcome === 'immune' ? 'ring' : outcome === 'decoy' ? 'shard'
            : outcome === 'heal' ? 'petal' : ({ cut: 'slash', ripple: 'wave', thud: 'ring', crack: 'bolt', seal: 'seal', bind: 'ring', heal: 'petal', drain: 'orb' }[profile.impact] || profile.shape);
        const fade = 1 - value;
        const anchor = outcome === 'heal' ? { x: to.x, y: to.y - size * value } : to;
        paint(ctx, shape, anchor, size * mix(.68, outcome === 'hit' ? 1.62 : 1.26, value), colors, fade * (refused ? .65 : .92), Math.atan2(to.y - from.y, to.x - from.x), value);
        if (outcome !== 'hit' || profile.impact === 'none') return;
        const count = width < 480 ? 4 : 6;
        for (let index = 0; index < count; index++) {
            const angle = index * 2 * PI / count;
            const distance = size * mix(.5, 2.25, value);
            const shard = { x: to.x + Math.cos(angle) * distance, y: to.y + Math.sin(angle) * distance };
            paint(ctx, 'shard', shard, size * (.10 + (index % 3) * .045), colors, fade * .77, angle);
        }
    }

    function poseSprite(element, pose, geometry, duration) {
        if (!element?.animate || duration < 50 || pose === 'still') return null;
        const from = geometry.from;
        const to = geometry.to;
        const x = clamp((to.x - from.x) * .19, -35, 35);
        const y = clamp((to.y - from.y) * .12, -19, 19);
        const poseFrames = {
            lunge: [{ translate: `${x}px ${y}px`, scale: '1.04 .96' }],
            snap: [{ translate: `${x * 1.25}px ${y * 1.25}px`, scale: '1.10 .90', offset: .26 }],
            rise: [{ translate: `0 ${-geometry.size * .66}px`, scale: '1.02 1.06' }],
            focus: [{ translate: '0 -2px', scale: '1.03' }],
            brace: [{ translate: `${-x * .17}px 2px`, scale: '1.04 .96' }],
            sweep: [{ translate: `${x * .42}px ${y * .61}px`, scale: '1.05' }],
        };
        return element.animate([{ translate: '0 0', scale: '1' }, ...(poseFrames[pose] || poseFrames.focus), { translate: '0 0', scale: '1' }], { duration, easing: 'ease-in-out' });
    }

    function createRun(screen, { rate, valid }) {
        let killed = false;
        let canvas;
        let ctx;
        let stopFrame;
        let pose;
        let reaction;
        let geometry;
        let layoutDirty = true;
        const markLayout = () => { layoutDirty = true; };
        const usable = () => !killed && valid() && !document.hidden && rate() > 0;

        function stop() {
            killed = true;
            stopFrame?.();
            pose?.cancel();
            reaction?.cancel();
            canvas?.remove();
            window.removeEventListener('resize', markLayout);
            document.removeEventListener('visibilitychange', visibility);
        }
        const visibility = () => { if (document.hidden) stop(); };
        window.addEventListener('resize', markLayout);
        document.addEventListener('visibilitychange', visibility);

        function surface(from, to, scope) {
            if (!canvas) {
                canvas = document.createElement('canvas');
                canvas.className = 'battle-stage-motion';
                canvas.setAttribute('aria-hidden', 'true');
                ctx = canvas.getContext('2d');
                if (!ctx) return false;
                screen.append(canvas);
            }
            geometry = metric(screen, canvas, from, to, scope);
            layoutDirty = false;
            return !!(ctx && geometry);
        }

        function during(duration, from, to, scope, paintFrame) {
            if (!(duration > 0 && usable())) return Promise.resolve();
            return new Promise(resolve => {
                const start = performance.now();
                let frame = 0;
                const done = () => {
                    cancelAnimationFrame(frame);
                    clearTimeout(timer);
                    stopFrame = null;
                    resolve();
                };
                stopFrame = done;
                const timer = setTimeout(done, duration + 50);
                const step = now => {
                    if (!usable()) return done();
                    if (layoutDirty && !surface(from, to, scope)) return done();
                    const progress = clamp((now - start) / duration, 0, 1);
                    ctx.setTransform(geometry.dpr, 0, 0, geometry.dpr, 0, 0);
                    ctx.clearRect(0, 0, geometry.width, geometry.height);
                    try { paintFrame(progress); }
                    catch { return done(); }
                    if (progress >= 1) done();
                    else frame = requestAnimationFrame(step);
                };
                frame = requestAnimationFrame(step);
            });
        }

        async function play(profile, { from, to, outcome = 'effect', onImpact = () => {} }) {
            if (!(usable() && profile && from && to && surface(from, to, profile.target))) { onImpact(); return; }
            const speed = rate();
            const { windup, travel, impact, settle } = profile.timing;
            const lead = (windup + travel) * speed;
            // The impact starts HP easing and log feedback. Limit the recovery hold
            // so an ordinary animation does not wait twice for that same beat.
            const signature = windup + travel + impact + settle >= 700;
            const tail = (impact + Math.min(settle, signature ? 100 : 35)) * speed;
            canvas.dataset.move = profile.id;
            canvas.dataset.outcome = outcome;
            pose?.cancel();
            reaction?.cancel();
            pose = poseSprite(from, profile.pose, geometry, lead + impact * speed);
            try {
                await during(lead, from, to, profile.target, value => drawApproach(ctx, profile, geometry, value, windup / Math.max(1, windup + travel), outcome));
                onImpact();
                if (outcome === 'hit' && to !== from && usable()) {
                    reaction = poseSprite(to, 'brace', { ...geometry, from: geometry.to, to: geometry.from }, impact * speed);
                }
                await during(tail, from, to, profile.target, value => drawImpact(ctx, profile, geometry, value, outcome));
            } finally {
                if (ctx && geometry) ctx.clearRect(0, 0, geometry.width, geometry.height);
            }
        }

        return { play, stop, usable };
    }

    window.BattleMotion = { analyzeMove, createRun };
})();
