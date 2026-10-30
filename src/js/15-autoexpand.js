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
