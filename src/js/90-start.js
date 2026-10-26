  function start() {
    if (disposed) return;
    root.setAttribute("zia-flat-lite", "true");
    root.style.setProperty("--zia-media-glow-a", "#50b2e8");
    root.style.setProperty("--zia-media-glow-b", "#50b2e8");
    cleanups.push(() => root.removeAttribute("zia-flat-lite"));
    setup("theme", watchTheme);
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
