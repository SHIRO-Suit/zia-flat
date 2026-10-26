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
