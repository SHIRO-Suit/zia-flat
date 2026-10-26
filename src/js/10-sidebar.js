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
