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

  function watchTheme() {
    const media = window.matchMedia("(prefers-color-scheme: light)");
    function update() {
      const mark = root.getAttribute("zen-should-be-dark-mode");
      const light = mark === "false" || (mark === null &&
        (window.gZenThemePicker ? !window.gZenThemePicker.isDarkMode : media.matches));
      root.toggleAttribute("zia-light", light);
      root.setAttribute("zia-site-light", light ? "true" : "false");
      root.setAttribute("zia-site-dark", light ? "false" : "true");
    }
    observe(root, update, { attributes: true, attributeFilter: ["zen-should-be-dark-mode", "zen-default-theme"] });
    listen(media, "change", update);
    update();
  }
  function watchWorkspaceLabel() {
    const top = document.getElementById("zen-sidebar-top-buttons");
    const manager = window.gZenWorkspaces;
    if (!top || !manager) return;
    const slot = document.createElementNS(XHTML_NS, "div");
    slot.id = "zia-workspace-slot";
    const buttons = top.querySelector(":scope > .titlebar-buttonbox-container");
    if (buttons && buttons === top.firstElementChild) buttons.after(slot); else top.prepend(slot);
    let moved = null, home = null, next = null;
    function restore() {
      if (moved && home?.isConnected) {
        home.insertBefore(moved, next?.parentNode === home ? next : null);
        moved.querySelector("#zia-space-label")?.remove();
      }
      moved = home = next = null;
    }
    const update = () => {
      const space = manager.activeWorkspaceElement;
      const indicator = space?.indicator;
      if (indicator !== moved) {
        restore();
        if (indicator) {
          home = indicator.parentNode;
          next = indicator.nextSibling;
          moved = indicator;
          slot.append(indicator);
        }
      }
      if (!indicator) return;
      const workspace = manager.getActiveWorkspace();
      let label = indicator.querySelector("#zia-space-label");
      if (!label) {
        label = document.createElementNS(XHTML_NS, "div");
        label.id = "zia-space-label";
        const name = document.createElementNS(XHTML_NS, "span");
        name.className = "zia-space-name";
        label.append(name);
        indicator.prepend(label);
      }
      text(label.querySelector(".zia-space-name"), workspace?.name || "");
      const icon = workspace?.icon || "";
      const isFile = /^(chrome|resource):/.test(icon);
      const emoji = icon && !isFile && !/^[a-z]+:/i.test(icon) ? icon : "";
      label.setAttribute("zia-icon", emoji);
      label.toggleAttribute("zia-has-icon", !!emoji);
      let image = label.querySelector(".zia-space-svg");
      if (isFile && !image) {
        image = document.createElementNS(XHTML_NS, "img");
        image.className = "zia-space-svg";
        label.prepend(image);
      }
      if (image) { if (isFile) image.setAttribute("src", icon); else image.remove(); }
      label.toggleAttribute("zia-has-svg", isFile);
      root.setAttribute("zia-workspace-slot", "true");
    };
    const schedule = queueFrame(update);
    for (const type of ["ZenWorkspacesUIUpdate", "ZenWorkspaceDataChanged", "AfterWorkspacesSessionRestore"]) listen(window, type, schedule);
    const onPref = () => schedule();
    Services.prefs.addObserver("zen.workspaces.active", onPref);
    cleanups.push(() => Services.prefs.removeObserver("zen.workspaces.active", onPref));
    cleanups.push(() => { restore(); slot.remove(); });
    update();
  }

  function watchAutoExpandCompatibility() {
    // This variable is defined by Sidebar Expand on Hover only while its
    // stylesheet's layout is active. Stored preferences alone do not enable it.
    const update = () => {
      const active = getComputedStyle(root).getPropertyValue("--expanded-tab-bar-width").trim() !== "";
      root.toggleAttribute("zia-flat-autoexpand", active);
    };
    const schedule = queueFrame(update);
    observe(root, schedule, { attributes: true,
      attributeFilter: ["sizemode", "zen-compact-mode", "zen-single-toolbar", "zen-sidebar-expanded"] });
    cleanups.push(() => root.removeAttribute("zia-flat-autoexpand"));
    update();
  }

  function watchAddressTitle() {
    const urlbar = window.gURLBar;
    const input = urlbar?.inputField;
    if (!input?.parentNode) return;
    const bar = document.getElementById("urlbar");
    const makeTitle = id => {
      const box = document.createElementNS(XHTML_NS, "div");
      box.id = id;
      for (const part of ["host", "rest"]) {
        const span = document.createElementNS(XHTML_NS, "span");
        span.className = `zia-url-title-${part}`;
        box.append(span);
      }
      input.parentNode.append(box);
      cleanups.push(() => box.remove());
      return box;
    };
    const title = makeTitle("zia-url-title"), plain = makeTitle("zia-url-plain");
    const update = () => {
      const browser = gBrowser.selectedBrowser;
      const uri = browser?.currentURI;
      let host = "", path = "";
      try {
        if (uri && /^https?$/.test(uri.scheme)) {
          host = uri.displayHost.replace(/^www\./, "");
          path = uri.pathQueryRef || "";
        }
      } catch (_) { /* internal pages retain Zen's normal address */ }
      const valid = host && bar.getAttribute("pageproxystate") === "valid";
      if (!valid) { bar.removeAttribute("zia-has-title"); return; }
      const pageTitle = (browser.contentTitle || "").trim();
      text(title.firstChild, host);
      text(title.lastChild, pageTitle && path !== "/" && pageTitle !== host ? ` / ${pageTitle}` : "");
      text(plain.firstChild, host);
      text(plain.lastChild, path === "/" ? "" : path);
      bar.setAttribute("zia-has-title", "true");
    };
    const schedule = queueFrame(update);
    listen(gBrowser.tabContainer, "TabSelect", schedule);
    listen(gBrowser.tabContainer, "TabAttrModified", event => { if (event.target === gBrowser.selectedTab) schedule(); });
    observe(bar, schedule, { attributes: true, attributeFilter: ["pageproxystate"] });
    const progress = { onLocationChange: browser => { if (browser === gBrowser.selectedBrowser) schedule(); } };
    gBrowser.addTabsProgressListener(progress);
    cleanups.push(() => { gBrowser.removeTabsProgressListener(progress); bar.removeAttribute("zia-has-title"); });
    update();
  }

  function bestArtwork(artwork) {
    return [...(Array.isArray(artwork) ? artwork : [])]
      .filter(item => /^https?:|^data:image\/|^blob:/i.test(item.src || ""))
      .sort((a, b) => {
        const area = item => Math.max(0, ...String(item.sizes || "").split(/\s+/).map(size => size.split("x").reduce((a, b) => (parseInt(a) || 0) * (parseInt(b) || 0))));
        return area(b) - area(a);
      })[0]?.src || "";
  }
  function ensureMediaRing(button) {
    if (button.querySelector(":scope > .zia-ring")) return;
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "zia-ring");
    svg.setAttribute("viewBox", "0 0 46 46");
    svg.setAttribute("aria-hidden", "true");
    for (const kind of ["track", "fill"]) {
      const path = document.createElementNS(SVG_NS, "path");
      for (const [name, value] of Object.entries({
        class: `zia-ring-${kind}`, d: "M23 1 L45 1 L45 45 L1 45 L1 1 Z",
        fill: "none", stroke: kind === "fill" ? "#50b2e8" : "rgba(255,255,255,.14)",
        "stroke-width": "2", pathLength: "100", "stroke-linecap": "butt", "stroke-linejoin": "miter",
      })) path.setAttribute(name, value);
      svg.append(path);
    }
    button.append(svg);
  }
  function mediaFraction(card) {
    return Number.isFinite(card.duration) && card.duration > 0 && card.duration < 900000
      ? Math.max(0, Math.min(1, Number(card.progressBar?.value || 0) / 100)) : 0;
  }
  function watchMedia() {
    const toolbar = document.getElementById("zen-media-controls-toolbar");
    if (!toolbar) return;
    const remembered = new WeakMap();
    function refresh() {
      const card = window.gZenMediaController?.frontCard;
      if (!card?.element?.isConnected || card.element.hidden || !card.focusButton) return;
      const button = card.focusButton;
      let art = "";
      try { art = bestArtwork(card.controller?.getMetadata?.()?.artwork); } catch (_) { /* favicon fallback */ }
      if (remembered.get(button) !== art) {
        remembered.set(button, art);
        if (art) {
          button.setAttribute("zia-art", art);
          button.style.setProperty("--zia-media-art", `url(${JSON.stringify(art)})`);
        } else {
          button.removeAttribute("zia-art");
          button.style.removeProperty("--zia-media-art");
        }
      }
      ensureMediaRing(button);
      const fraction = mediaFraction(card);
      const ring = button.querySelector(".zia-ring-fill");
      const dash = `${(fraction * 100).toFixed(2)} 100`;
      if (ring.style.strokeDasharray !== dash) ring.style.strokeDasharray = dash;
      ring.style.strokeOpacity = fraction > 0 ? "1" : "0";
    }
    const schedule = queueFrame(refresh);
    // Native media time/metadata changes drive this. Own writes affect neither
    // text nor watched attributes, except one initial SVG insertion.
    observe(toolbar, schedule, { childList: true, characterData: true, subtree: true, attributes: true,
      attributeFilter: ["hidden", "media-position-hidden", "stacked-behind"] });
    listen(toolbar, "input", schedule);
    listen(toolbar, "pointerover", schedule);
    refresh();
  }

  const FLIGHT_POP_MS = 120;
  const FLIGHT_WINDUP_MS = 420;
  const FLIGHT_LAUNCH_MS = 560;
  const FLIGHT_SETTLE_MS = 320;

  function flightTarget() {
    for (const id of ["zen-library-button", "downloads-button"]) {
      const button = document.getElementById(id);
      const box = button?.getBoundingClientRect();
      if (box && box.width > 0 && box.height > 0 && box.right > 0 && box.left < window.innerWidth && box.bottom > 0 && box.top < window.innerHeight) {
        return { button, x: box.left + box.width / 2, y: box.top + box.height / 2 };
      }
    }
    return null;
  }

  function flightName(download) {
    const path = download.target?.path;
    if (path) {
      return PathUtils.filename(path);
    }
    try {
      return decodeURIComponent(new URL(download.source?.url || "").pathname.split("/").pop()) || "Download";
    } catch (err) {
      return "Download";
    }
  }

  function flightPart(className, parent) {
    const node = document.createElementNS(XHTML_NS, "div");
    node.className = className;
    parent?.appendChild(node);
    return node;
  }

  function flyDownloadRow(download, start) {
    const target = flightTarget();
    if (!target) {
      return;
    }
    document.getElementById("zia-download-flight")?.remove();
    const stage = flightPart("");
    stage.id = "zia-download-flight";
    const dim = flightPart("zia-df-dim", stage);
    const beam = flightPart("zia-df-beam", stage);
    const bloom = flightPart("zia-df-bloom", stage);
    const row = flightPart("zia-df-row", stage);
    const name = flightName(download);
    const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")) : "";
    const icon = document.createElementNS(XHTML_NS, "img");
    icon.className = "zia-df-icon";
    icon.src = `moz-icon://${ext || ".bin"}?size=16`;
    const label = document.createElementNS(XHTML_NS, "span");
    label.className = "zia-df-name";
    label.textContent = name;
    row.append(icon, label);
    root.appendChild(stage);

    const { width, height } = row.getBoundingClientRect();
    const keep = (x, y) => ({
      x: Math.min(window.innerWidth - width / 2 - 8, Math.max(width / 2 + 8, x)),
      y: Math.min(window.innerHeight - height / 2 - 8, Math.max(height / 2 + 8, y)),
    });
    // (centred just above where you last clicked)
    const p0 = keep(start.clientX, start.clientY - height * 0.9);
    const dx = target.x - p0.x;
    const dy = target.y - p0.y;
    const distance = Math.hypot(dx, dy) || 1;
    // The path, as Dia's: one swoop. It drops straight away from the
    // button (down when the button's above, up when it's below), rounds
    // the turn, then sweeps off in a long curve to the button: a cubic
    // curve whose first handle points straight away and whose second sits
    // out level with it, a little way towards the button.
    const away = -Math.sign(dy || -1);
    const drop = Math.min(120, Math.max(60, distance * 0.16));
    const c1 = { x: p0.x, y: p0.y + away * drop };
    const c2 = { x: p0.x + dx * 0.42, y: p0.y + away * drop * 1.1 };
    const bez = (u, a, b, c, d) => (1 - u) ** 3 * a + 3 * (1 - u) ** 2 * u * b + 3 * (1 - u) * u ** 2 * c + u ** 3 * d;
    const point = (u) => ({ x: bez(u, p0.x, c1.x, c2.x, target.x), y: bez(u, p0.y, c1.y, c2.y, target.y) });
    const at = (x, y, rotate, scale) => `translate(${x - p0.x}px, ${y - p0.y}px) translate(-50%, -50%) rotate(${rotate}deg) scale(${scale})`;

    row.style.left = `${p0.x}px`;
    row.style.top = `${p0.y}px`;
    const total = FLIGHT_POP_MS + FLIGHT_WINDUP_MS + FLIGHT_LAUNCH_MS;
    const o = (ms) => ms / total;
    const frames = [
      { offset: 0, transform: at(start.clientX, start.clientY, 0, 0.45), opacity: 0 },
      { offset: o(FLIGHT_POP_MS), transform: at(p0.x, p0.y, 0, 1), opacity: 1 },
    ];
    // along the path: slow through the turn, then fast, easing in at the
    // end. It leans one way the whole flight, as Dia's does (anticlockwise
    // flying up and left; mirrored for the button below or to the right):
    // the lean builds smoothly through the turn and eases off across the
    // sweep. (Following the path's own slope, it flipped side to side
    // where the path ran straight up.)
    const lean = -Math.sign(dx * dy || 1) * 7;
    const smooth = (a, b, x) => {
      const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return k * k * (3 - 2 * k);
    };
    const STEPS = 48;
    const flightMs = FLIGHT_WINDUP_MS + FLIGHT_LAUNCH_MS;
    for (let i = 1; i <= STEPS; i++) {
      const t = i / STEPS;
      // (a gentle ease, its top speed only about one and a half times its
      // average: a steeper one crossed 100px between frames mid-flight,
      // and read as jumpy)
      const u = 0.5 - 0.5 * Math.cos(Math.PI * t);
      const here = point(u);
      const tilt = lean * smooth(0, 0.35, t) * (1 - smooth(0.45, 0.9, t));
      frames.push({
        offset: o(FLIGHT_POP_MS + flightMs * t),
        transform: at(here.x, here.y, tilt.toFixed(2), (1 - 0.65 * smooth(0.45, 1, u)).toFixed(4)),
        opacity: (1 - smooth(0.7, 1, u)).toFixed(4),
      });
    }
    // (only movement and fading, which Firefox runs on the graphics card:
    // with a blur in it too, it ran frame by frame alongside everything
    // else a download starts, and stuttered)
    const flight = row.animate(frames, { duration: total, easing: "linear", fill: "forwards" });

    // the dim: in as it winds up, out once it's landed
    const settle = total + FLIGHT_SETTLE_MS;
    const so = (ms) => ms / settle;
    dim.animate(
      [
        { opacity: 0, easing: "ease-in-out" },
        { opacity: 1, offset: so(FLIGHT_POP_MS + FLIGHT_WINDUP_MS) },
        { opacity: 1, offset: so(total), easing: "ease-out" },
        { opacity: 0 },
      ],
      { duration: settle, easing: "linear", fill: "forwards" }
    );

    // the light: a faint glow trailing just behind the row along its own
    // path, as in Dia, only a breath brighter than the dim
    beam.style.left = row.style.left;
    beam.style.top = row.style.top;
    beam.animate(
      frames.map((frame, i) => ({
        offset: frame.offset,
        transform: frame.transform.replace(/scale\(([\d.]+)\)/, (_, n) => `scale(${(Number(n) * 1.6).toFixed(3)})`),
        opacity: i < 3 ? 0 : frame.opacity,
      })),
      { duration: total, delay: 40, easing: "linear", fill: "forwards" }
    );

    // the bloom where it lands
    Object.assign(bloom.style, { left: `${target.x}px`, top: `${target.y}px` });
    bloom.animate(
      [
        { opacity: 0, scale: 0.4 },
        { opacity: 0, scale: 0.4, offset: so(FLIGHT_POP_MS + FLIGHT_WINDUP_MS + FLIGHT_LAUNCH_MS * 0.5) },
        { opacity: 1, scale: 1, offset: so(total) },
        { opacity: 0, scale: 1.3 },
      ],
      { duration: settle, easing: "linear", fill: "forwards" }
    );

    later(() => {
      target.button.animate(
        [{ transform: "scale(1)" }, { transform: "scale(1.18)", offset: 0.4 }, { transform: "scale(1)" }],
        { duration: 360, easing: "cubic-bezier(0.3, 1.4, 0.5, 1)" }
      );
    }, total - 40);
    later(() => stage.remove(), settle + 40);
    flight.finished.catch(() => stage.remove());
  }

  // Firefox's "What should Zen do with this file?" box opened wherever the
  // system put it, top left of the screen: it's centred on the page of the
  // window it's for, every time, and saving from it sends the download's
  // flight from there.

  function watchDownloads() {
    const Downloads = window.Downloads || ChromeUtils.importESModule("resource://gre/modules/Downloads.sys.mjs").Downloads;
    const active = new Map();
    let ready = false, list = null;
    const button = document.getElementById("downloads-button");
    let arc = null;
    if (button) {
      const svg = document.createElementNS(SVG_NS, "svg");
      svg.id = "zia-download-ring";
      svg.setAttribute("viewBox", "0 0 100 100");
      for (const kind of ["track", "arc"]) {
        const circle = document.createElementNS(SVG_NS, "circle");
        for (const [key, value] of Object.entries({ cx: "50", cy: "50", r: "46", fill: "none",
          "stroke-width": "7", class: `zia-download-ring-${kind}` })) circle.setAttribute(key, value);
        svg.append(circle);
        if (kind === "arc") arc = circle;
      }
      arc.setAttribute("transform", "rotate(-90 50 50)");
      arc.style.strokeDasharray = `${2 * Math.PI * 46}`;
      button.append(svg);
      cleanups.push(() => { svg.remove(); button.removeAttribute("zia-downloading"); });
    }
    function progress(download, removed = false) {
      if (removed || download.succeeded || download.canceled || download.error || download.stopped) active.delete(download);
      else active.set(download, download);
      if (!button || !arc) return;
      let done = 0, total = 0;
      for (const item of active.values()) if (item.hasProgress && item.totalBytes > 0) {
        done += item.currentBytes || 0; total += item.totalBytes;
      }
      button.toggleAttribute("zia-downloading", total > 0);
      arc.style.strokeDashoffset = `${2 * Math.PI * 46 * (1 - (total > 0 ? Math.min(1, done / total) : 0))}`;
    }
    let lastClick = null;
    listen(window, "click", event => {
      if (event.button === 0) lastClick = { clientX: event.clientX, clientY: event.clientY, at: Date.now() };
    }, true);
    const view = {
      onDownloadAdded(download) {
        progress(download);
        if (!ready || disposed || download.succeeded || Services.focus.activeWindow !== window ||
            matchMedia("(prefers-reduced-motion: reduce)").matches ||
            !Services.prefs.getBoolPref("zen.downloads.download-animation", true)) return;
        const started = download.startTime?.getTime?.() || 0;
        if (Date.now() - started > 5000) return;
        const start = lastClick && Date.now() - lastClick.at < 10000 ? lastClick : window.gZenUIManager?._lastClickPosition;
        if (start && flightTarget()) {
          try { flyDownloadRow(download, start); } catch (error) { noteError("download animation", error); }
        }
      },
      onDownloadChanged: download => progress(download),
      onDownloadRemoved: download => progress(download, true),
    };
    cleanups.push(() => { ready = false; list?.removeView(view); active.clear(); });
    Downloads.getList(Downloads.ALL).then(async result => {
      if (disposed) return;
      list = result;
      await list.addView(view);
      ready = !disposed;
    }).catch(error => noteError("downloads", error));
  }

  function start() {
    if (disposed) return;
    root.setAttribute("zia-flat-lite", "true");
    root.style.setProperty("--zia-media-glow-a", "#50b2e8");
    root.style.setProperty("--zia-media-glow-b", "#50b2e8");
    cleanups.push(() => root.removeAttribute("zia-flat-lite"));
    setup("theme", watchTheme);
    setup("auto-expand compatibility", watchAutoExpandCompatibility);
    setup("sidebar", watchWorkspaceLabel);
    setup("address bar", watchAddressTitle);
    setup("media player", watchMedia);
    setup("downloads", watchDownloads);
  }
  if (window.gBrowserInit?.delayedStartupFinished) start();
  else {
    const observer = subject => {
      if (subject !== window) return;
      Services.obs.removeObserver(observer, "browser-delayed-startup-finished");
      start();
    };
    Services.obs.addObserver(observer, "browser-delayed-startup-finished");
    cleanups.push(() => {
      try { Services.obs.removeObserver(observer, "browser-delayed-startup-finished"); } catch (_) { /* already started */ }
    });
  }
})();
