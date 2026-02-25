/* empty css               */
const popupSize = document.getElementById("popup-size");
const popupTimeout = document.getElementById("popup-timeout");
const autoStart = document.getElementById("auto-start");
const preventDuplicate = document.getElementById("prevent-duplicate");
const shortcutClear = document.getElementById("shortcut-clear");
const shortcutCopy = document.getElementById("shortcut-copy");
const personnelNameInput = document.getElementById("personnel-name");
const userRoleSelect = document.getElementById("user-role");
const saveBtn = document.getElementById("save-btn");
window.electronAPI.getSettings().then((settings) => {
  popupSize.value = settings.popupSizeLevel || 2;
  popupTimeout.value = settings.popupTimeout || 5e3;
  autoStart.checked = settings.autoStartEnabled || false;
  preventDuplicate.checked = settings.preventDuplicatePopup || false;
  shortcutClear.value = settings.shortcuts?.clearCache || "CommandOrControl+Shift+X";
  shortcutCopy.value = settings.shortcuts?.toggleMonitoring || "CommandOrControl+Shift+C";
  personnelNameInput.value = settings.personnelName || "";
  userRoleSelect.value = settings.role || "kargo_kabul";
});
function setupShortcutRecorder(input) {
  input.onkeydown = (e) => {
    e.preventDefault();
    const keys = [];
    if (e.ctrlKey || e.metaKey) keys.push("CommandOrControl");
    if (e.shiftKey) keys.push("Shift");
    if (e.altKey) keys.push("Alt");
    if (!["Control", "Shift", "Alt", "Meta"].includes(e.key)) {
      keys.push(e.key.toUpperCase());
      input.value = keys.join("+");
    }
  };
}
setupShortcutRecorder(shortcutClear);
setupShortcutRecorder(shortcutCopy);
saveBtn.onclick = () => {
  const settings = {
    popupSizeLevel: parseInt(popupSize.value),
    popupTimeout: parseInt(popupTimeout.value),
    autoStartEnabled: autoStart.checked,
    preventDuplicatePopup: preventDuplicate.checked,
    shortcuts: {
      clearCache: shortcutClear.value,
      toggleMonitoring: shortcutCopy.value
    },
    personnelName: personnelNameInput.value.trim(),
    role: userRoleSelect.value
  };
  window.electronAPI.saveSettings(settings).then(() => {
    window.close();
  });
};
