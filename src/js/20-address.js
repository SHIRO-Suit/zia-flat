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
