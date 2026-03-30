/**
 * VerdeX UI State Manager
 * Handles blocking buttons and animating pending actions across the dashboard.
 */

export const UiState = {
  /**
   * Toggles a button into a securely locked processing state.
   * @param {HTMLElement|string} btn - Button DOM node or ID string.
   * @param {boolean} isProcessing - True to lock, false to unlock.
   */
  setLoading: (btn, isProcessing) => {
    let el = typeof btn === 'string' ? document.getElementById(btn) : btn;
    if (!el) return;

    if (isProcessing) {
      // Secure the old text natively into the DOM object
      el.dataset.origHtml = el.innerHTML;
      
      // Override DOM to processing UI
      el.innerHTML = '<span style="display:inline-block;animation:spin 1s linear infinite;">⏳</span> Processing...';
      el.style.opacity = '0.7';
      el.disabled = true;
      el.style.cursor = 'not-allowed';
    } else {
      // Reconstitute original element logic
      if (el.dataset.origHtml) {
        el.innerHTML = el.dataset.origHtml;
      }
      el.style.opacity = '1';
      el.disabled = false;
      el.style.cursor = 'pointer';
    }
  }
};
