// Zia Flat Lite: selected Zia presentation with a small event-driven runtime.
// Upstream styles and download flight: z1nk, MIT; see LICENSE and README.
(() => {
  if (window.__ziaFlatLite || document.documentElement.getAttribute("chromehidden")?.includes("toolbar") ||
      document.documentElement.getAttribute("zen-little-window") === "true") return;
  if (window.__ziaLoaded) {
    console.warn("[Zia Flat Lite] Disable the original Zia and restart Zen first.");
    return;
  }
  window.__ziaFlatLite = true;
  const root = document.documentElement;
  const XHTML_NS = "http://www.w3.org/1999/xhtml";
  const SVG_NS = "http://www.w3.org/2000/svg";
  const cleanups = [];
  const timers = new Set();
  let disposed = false;
  function listen(target, type, fn, options) {
    target?.addEventListener(type, fn, options);
    cleanups.push(() => target?.removeEventListener(type, fn, options));
  }
  function observe(target, fn, options) {
    if (!target) return;
    const observer = new MutationObserver(fn);
    observer.observe(target, options);
    cleanups.push(() => observer.disconnect());
  }
  function later(fn, delay) {
    const id = setTimeout(() => { timers.delete(id); if (!disposed) fn(); }, delay);
    timers.add(id);
    return id;
  }
  function queueFrame(fn) {
    let frame = null;
    cleanups.push(() => { if (frame !== null) cancelAnimationFrame(frame); });
    return () => {
      if (disposed || frame !== null) return;
      frame = requestAnimationFrame(() => { frame = null; if (!disposed) fn(); });
    };
  }
  function text(node, value) {
    if (node && node.textContent !== value) node.textContent = value;
  }
  function noteError(where, error) {
    console.warn(`[Zia Flat Lite] ${where}`, error);
  }
  function setup(name, fn) {
    try { fn(); } catch (error) { noteError(name, error); }
  }
  listen(window, "unload", () => {
    disposed = true;
    for (const id of timers) clearTimeout(id);
    timers.clear();
    for (const dispose of cleanups.splice(0).reverse()) dispose();
    document.getElementById("zia-download-flight")?.remove();
  }, { once: true });
