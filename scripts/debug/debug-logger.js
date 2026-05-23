(function () {
  if (typeof window === 'undefined') return;
  if (window.__debugLogger) return;

  var MAX_EVENTS = 2000;
  var ring = [];
  var origLog = window.console.log;
  var origWarn = window.console.warn;
  var origError = window.console.error;
  var origInfo = window.console.info;

  function push(level, args) {
    if (ring.length >= MAX_EVENTS) ring.shift();
    var msg = Array.prototype.map.call(args, function (a) {
      try {
        if (typeof a === 'string') return a;
        if (a instanceof Error) return a.stack || a.message;
        return JSON.stringify(a);
      } catch (e) { return String(a); }
    }).join(' ');
    ring.push({ t: Date.now(), level: level, msg: msg.slice(0, 4096) });
  }

  window.console.log = function () { push('log', arguments); origLog.apply(window.console, arguments); };
  window.console.warn = function () { push('warn', arguments); origWarn.apply(window.console, arguments); };
  window.console.error = function () { push('error', arguments); origError.apply(window.console, arguments); };
  window.console.info = function () { push('info', arguments); origInfo.apply(window.console, arguments); };

  window.addEventListener('error', function (e) {
    push('uncaught', [e.message || 'unknown', e.filename + ':' + e.lineno + ':' + e.colno]);
  });
  window.addEventListener('unhandledrejection', function (e) {
    push('rejection', [(e.reason && (e.reason.stack || e.reason.message)) || String(e.reason)]);
  });

  function snapshotEngineState() {
    var s = {};
    try {
      s.hasEngine = typeof window.__engine !== 'undefined';
      s.hasSm = typeof window.sm !== 'undefined';
      if (window.sm) {
        s.eventIndex = window.sm.eventIndex;
        s.badges = window.sm.badges;
        s.teamLen = Array.isArray(window.sm.team) ? window.sm.team.length : null;
        s.pcLen = Array.isArray(window.sm.pcBox) ? window.sm.pcBox.length : null;
        s.runSeed = window.sm.runSeed;
        s.catchTutorialDone = !!window.sm.catchTutorialDone;
      }
      if (window.state) {
        s.battleTurn = window.state.turnNumber;
        s.weather = window.state.weather;
      }
    } catch (e) { s._snapshotError = String(e); }
    return s;
  }

  window.__debugLogger = {
    version: 1,
    events: function () { return ring.slice(); },
    clear: function () { ring.length = 0; },
    snapshot: snapshotEngineState,
    export: function () {
      var payload = {
        capturedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: location.href,
        engine: snapshotEngineState(),
        events: ring.slice(),
      };
      var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'debug-log-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 100);
      return payload;
    },
  };

  origLog.call(window.console, '[debug-logger] active — call window.__debugLogger.export() to download a postmortem.');
})();
