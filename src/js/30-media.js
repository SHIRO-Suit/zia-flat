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
