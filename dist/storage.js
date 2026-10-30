(function (root) {
  'use strict';
  const KEY = 'maison-aurelle-concept-v1';
  function createStore({ storage, cleanState, locks, onChange = () => {} }) {
    let state = cleanState(null), memoryOnly = false, queue = Promise.resolve();
    const read = () => cleanState(JSON.parse(storage.getItem(KEY)));
    try { state = read(); } catch { memoryOnly = true; }
    function serialized(operation) {
      const run = () => locks ? locks.request(KEY, operation) : operation();
      const result = queue.then(run);
      queue = result.catch(() => {});
      return result;
    }
    return {
      get: () => cleanState(state),
      ready: () => queue.then(() => cleanState(state)),
      update(change) {
        return serialized(() => {
          // Read inside the shared lock so a stale tab cannot overwrite newer data.
          if (!memoryOnly) { try { state = read(); } catch { memoryOnly = true; } }
          state = cleanState(change(cleanState(state)));
          if (!memoryOnly) {
            try { storage.setItem(KEY, JSON.stringify(state)); } catch { memoryOnly = true; }
          }
          return { state: cleanState(state), saved: !memoryOnly };
        });
      },
      clear() {
        return serialized(() => {
          state = cleanState(null);
          try {
            storage.removeItem(KEY);
            if (storage.getItem(KEY) !== null) throw new Error('Storage was not cleared');
            memoryOnly = false;
          } catch { memoryOnly = true; }
          return { state: cleanState(state), saved: !memoryOnly };
        });
      },
      sync(event) {
        if (event.storageArea !== storage || (event.key !== KEY && event.key !== null)) return;
        // A clear in another tab also discards this tab's temporary personal data.
        if (memoryOnly && event.newValue !== null) return;
        try { state = read(); } catch { return; }
        onChange(cleanState(state));
      }
    };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { createStore, KEY };
  root.AurelleStorage = { createStore, KEY };
})(typeof window !== 'undefined' ? window : globalThis);
