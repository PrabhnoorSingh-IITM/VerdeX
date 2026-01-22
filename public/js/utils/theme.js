export function applyTheme(theme) {
  document.body.classList.remove("light", "dark");

  if (theme === "light") {
    document.body.classList.add("light");
  } else {
    document.body.classList.add("dark");
  }
}

export function loadTheme() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const savedTheme = localStorage.getItem("theme") || "dark";
      applyTheme(savedTheme);
    });
  } else {
    const savedTheme = localStorage.getItem("theme") || "dark";
    applyTheme(savedTheme);
  }
}
