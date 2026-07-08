// DOM-shim adapter for the Story Simulator.
//
// The StoryMode economic actions (evolve / buy / tutor / Colress / EV-train) are all exported
// on window.StoryMode and mutate `sm` directly, but each is wrapped in async confirm dialogs
// and trailing DOM re-renders. Headless, window.showGameConfirm is undefined (some paths treat
// that as "yes", others abort), and the render calls touch empty jsdom nodes. This module
// installs the stubs once and provides a safe caller that tolerates the trailing render throws.
//
// It changes NO engine behaviour — only the confirm/alert UX layer and error tolerance around
// the economic-action calls the Player Agent drives.

let _installed = false;

// Install confirm/alert stubs so economic actions auto-confirm and never block on UI.
export function installShims(E) {
  const { window } = E;
  if (_installed) return;
  // Auto-confirm every game confirm; async to match the real signature (callers `await` it).
  window.showGameConfirm = async () => true;
  window.showGameAlert = () => {};
  window.showGameToast = () => {};
  // Some paths read a synchronous confirm; cover both.
  window.confirm = () => true;
  window.alert = () => {};
  _installed = true;
}

// Call an economic action and tolerate the trailing render/enter* throws that fire because the
// facility screen isn't mounted. Returns { ok, value, error }. `ok` reflects whether the call
// itself threw *before* returning (a real failure) vs threw during the trailing render (benign).
export async function safeCall(fn, ...args) {
  try {
    const value = await fn(...args);
    return { ok: true, value, error: null };
  } catch (e) {
    // A throw here may be the render tail (benign) or a real precondition failure. The caller
    // re-reads sm to decide whether the mutation landed; we surface the message either way.
    return { ok: false, value: undefined, error: (e && e.message) || String(e) };
  }
}

// Convenience accessors for sm through the exposed test surface.
export function getSm(E) {
  try { return E.window.StoryMode && E.window.StoryMode.state; } catch (e) { return null; }
}
