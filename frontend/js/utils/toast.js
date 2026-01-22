let toastEl = null;

export function initToast() {
  // Create toast element once
  toastEl = document.createElement("div");
  toastEl.id = "toast";
  toastEl.className = "glass-toast hidden";
  document.body.appendChild(toastEl);
}

export function showToast(message, type = "success", duration = 2800) {
  if (!toastEl) {
    console.warn("Toast not initialized. Call initToast() first.");
    return;
  }

  toastEl.textContent = message;
  toastEl.className = `glass-toast ${type}`;
  toastEl.classList.remove("hidden");

  setTimeout(() => {
    toastEl.classList.add("hidden");
  }, duration);
}
