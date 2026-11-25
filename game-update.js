/* Check the origin for a verified replacement of the installed game. */
(function () {
    'use strict';

    function waitForActivation(worker) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => finish(new Error('The update is taking longer than expected.')), 45000);
            function finish(error) {
                clearTimeout(timer);
                worker.removeEventListener('statechange', onStateChange);
                if (error) reject(error);
                else resolve(true);
            }
            function onStateChange() {
                if (worker.state === 'activated') finish();
                else if (worker.state === 'redundant') finish(new Error('The new game files could not be installed.'));
            }
            worker.addEventListener('statechange', onStateChange);
            onStateChange();
        });
    }

    // null means the browser has no installed worker. A worker only activates after verifying its files.
    window.checkForGameUpdate = async function (onInstalling) {
        const registration = await navigator.serviceWorker?.getRegistration();
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
            return await waitForActivation(worker);
        } finally {
            registration.removeEventListener('updatefound', rememberCandidate);
        }
    };
})();
