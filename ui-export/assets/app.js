
(() => {
  const defaultSection = "dashboard";
  const drawer = document.querySelector("[data-drawer]");
  const overlay = document.querySelector("[data-drawer-overlay]");
  const menuButton = document.querySelector("[data-menu-button]");
  const sections = [...document.querySelectorAll("[data-section]")];
  const navButtons = [...document.querySelectorAll("[data-section-target]")];
  const themeButtons = [...document.querySelectorAll("[data-theme-target]")];
  const tabButtons = [...document.querySelectorAll("[data-tab]")];

  function closeDrawer() {
    drawer?.classList.remove("open");
    overlay?.classList.remove("open");
    document.body.classList.remove("drawer-open");
    menuButton?.setAttribute("aria-expanded", "false");
  }

  function openDrawer() {
    drawer?.classList.add("open");
    overlay?.classList.add("open");
    document.body.classList.add("drawer-open");
    menuButton?.setAttribute("aria-expanded", "true");
  }

  function showSection(id, updateHash = true) {
    const target = document.querySelector('[data-section="' + id + '"]') ? id : defaultSection;
    sections.forEach((section) => section.classList.toggle("active", section.dataset.section === target));
    navButtons.forEach((button) => button.classList.toggle("active", button.dataset.sectionTarget === target && button.classList.contains("nav-item")));
    closeDrawer();
    if (updateHash) history.replaceState(null, "", "#" + target);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function setTheme(theme) {
    document.body.dataset.theme = theme;
    localStorage.setItem("prij-v104-static-theme", theme);
    themeButtons.forEach((button) => button.dataset.themeActive = String(button.dataset.themeTarget === theme));
  }

  menuButton?.addEventListener("click", openDrawer);
  overlay?.addEventListener("click", closeDrawer);
  navButtons.forEach((button) => button.addEventListener("click", () => showSection(button.dataset.sectionTarget)));
  themeButtons.forEach((button) => button.addEventListener("click", () => setTheme(button.dataset.themeTarget)));
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      tabButtons.forEach((candidate) => candidate.classList.toggle("active", candidate === button));
      button.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      const panel = document.querySelector("[data-tab-panel]");
      if (panel) {
        panel.dataset.tabPanel = button.dataset.tab;
        panel.querySelector("h2").textContent = button.textContent.trim();
      }
    });
  });
  window.addEventListener("hashchange", () => showSection(location.hash.slice(1), false));

  const savedTheme = localStorage.getItem("prij-v104-static-theme");
  setTheme(savedTheme || "clinic-premium");
  showSection(location.hash.slice(1) || defaultSection, false);
})();
