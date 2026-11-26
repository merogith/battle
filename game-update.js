/* Check the origin for a verified replacement of the installed game. */
(function () {
    'use strict';

    const workers = navigator.serviceWorker;
    if (!workers) return;
    let pending;
    let retryTimer;
    let applyRequest;
    let handoff;

    function canApply(prepare = false) {
        try { return window.gameUpdateCanApply?.(prepare) === true; }
        catch (_) { return false; }
    }

    function releaseHandoff(cancelled = false) {
        if (!handoff) return;
        clearTimeout(handoff.timer);
        if (!handoff.wasInert) handoff.body.inert = false;
        if (cancelled) {
            window.cancelPreparedGameUpdate?.();
            handoff.focus?.focus({ preventScroll: true });
        }
        handoff = null;
    }

    workers.addEventListener?.('message', event => {
        const type = event.data?.type;
        if (type === 'CANCEL_GAME_UPDATE') {
            releaseHandoff(true);
            return;
        }
        const port = event.ports?.[0];
        if (!port || !['CHECK_GAME_UPDATE', 'PREPARE_GAME_UPDATE'].includes(type)) return;
        const prepare = type === 'PREPARE_GAME_UPDATE';
        if (!canApply(prepare) || !window.document?.body) {
            port.postMessage(false);
            port.close?.();
            return;
        }
        if (prepare && !handoff) {
            const body = window.document.body;
            handoff = { body, wasInert: body.inert, focus: window.document.activeElement,
                timer: setTimeout(() => releaseHandoff(true), 8000) };
            body.inert = true;
        }
        port.postMessage(true);
        port.close?.();
    });
    workers.addEventListener?.('controllerchange', () => {
        pending = null;
        clearTimeout(retryTimer);
        retryTimer = null;
        if (!handoff) return;
        releaseHandoff();
        if (typeof window.finishPreparedGameUpdate === 'function') window.finishPreparedGameUpdate();
        else window.location.reload();
    });

    function waitForVerification(worker) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => finish(new Error('The update is taking longer than expected.')), 45000);
            function finish(error) {
                clearTimeout(timer);
                worker.removeEventListener('statechange', onStateChange);
                if (error) reject(error);
                else resolve(worker.state);
            }
            function onStateChange() {
                if (['installed', 'activating', 'activated'].includes(worker.state)) finish();
                else if (worker.state === 'redundant') finish(new Error('The new game files could not be installed.'));
            }
            worker.addEventListener('statechange', onStateChange);
            onStateChange();
        });
    }

    function askToActivate(worker) {
        if (typeof MessageChannel !== 'function') return Promise.resolve(false);
        return new Promise(resolve => {
            const channel = new MessageChannel();
            const timer = setTimeout(() => finish(false), 4500);
            function finish(accepted) {
                clearTimeout(timer);
                channel.port1.close();
                resolve(accepted);
            }
            channel.port1.onmessage = event => finish(event.data === true);
            try { worker.postMessage({ type: 'APPLY_GAME_UPDATE' }, [channel.port2]); }
            catch (_) { finish(false); }
        });
    }

    function retryWaitingUpdate() {
        if (!pending || retryTimer) return;
        retryTimer = setTimeout(() => {
            retryTimer = null;
            void window.applyWaitingGameUpdate();
        }, 3000);
    }

    window.applyWaitingGameUpdate = function () {
        if (applyRequest) return applyRequest;
        applyRequest = (async () => {
            const worker = pending;
            if (!worker) return false;
            if (worker.state === 'redundant') { pending = null; return false; }
            if (['activating', 'activated'].includes(worker.state)) return true;
            const accepted = canApply() && await askToActivate(worker);
            if (accepted) return true;
            if (pending) retryWaitingUpdate();
            return 'waiting';
        })().finally(() => { applyRequest = null; });
        return applyRequest;
    };

    // A verified worker can stay installed while an open game finishes its work.
    window.checkForGameUpdate = async function (onInstalling) {
        const registration = await workers.getRegistration();
        if (!registration) return null;
        const active = registration.active;
        let candidate = registration.installing || registration.waiting;
        const rememberCandidate = () => { candidate = registration.installing || candidate; };
        registration.addEventListener('updatefound', rememberCandidate);
        try {
            await registration.update();
            const worker = registration.installing || registration.waiting || (registration.active !== active && registration.active) || candidate;
            if (!worker) return false;
            onInstalling?.();
            const state = await waitForVerification(worker);
            if (state === 'activated') return true;
            if (state === 'activating') return 'applying';
            pending = worker;
            return await window.applyWaitingGameUpdate() === true ? 'applying' : 'waiting';
        } finally {
            registration.removeEventListener('updatefound', rememberCandidate);
        }
    };
})();
