document.querySelectorAll("[data-theme]").forEach((button) => {
  button.addEventListener("click", () => {
    document.documentElement.dataset.theme = button.dataset.theme || "default";
  });
});
