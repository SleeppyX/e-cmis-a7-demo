/* Loaded only by scripts/serve-demo.py, never by the static/owner pages. */
(() => {
  'use strict';
  const rewrite = value => {
    const url = new URL(value, location.href);
    if (url.hostname === 'ljhabbwjxnoucrcrsoii.supabase.co') {
      if (!url.pathname.startsWith('/rest/v1/')) throw new Error('Unsupported external endpoint in local A7 demo');
      return location.origin + '/__demo__/a7' + url.pathname + url.search;
    }
    return value;
  };
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, options) => {
    const url = input instanceof Request ? input.url : String(input);
    const target = rewrite(url);
    return originalFetch(target === url ? input : input instanceof Request ? new Request(target, input) : target, options);
  };
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    return originalOpen.call(this, method, rewrite(String(url)), ...args);
  };
})();
