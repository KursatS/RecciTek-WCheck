/* empty css               */
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
let initialRole = "";
window.electronAPI.getSettings().then((settings) => {
  if (settings.theme === "light") document.body.classList.add("light");
  popupSize.value = settings.popupSizeLevel || 2;
  popupTimeout.value = settings.popupTimeout || 5e3;
  autoStart.checked = settings.autoStartEnabled || false;
  preventDuplicate.checked = settings.preventDuplicatePopup || false;
  shortcutClear.value = settings.shortcuts?.clearCache || "CommandOrControl+Shift+X";
  shortcutCopy.value = settings.shortcuts?.toggleMonitoring || "CommandOrControl+Shift+C";
  personnelNameInput.value = (settings.personnelName || "").toUpperCase();
  userRoleSelect.value = settings.role || "";
  initialRole = settings.role || "";
});
personnelNameInput.addEventListener("input", () => {
  const start = personnelNameInput.selectionStart;
  const end = personnelNameInput.selectionEnd;
  personnelNameInput.value = personnelNameInput.value.replace(/\s/g, "").toUpperCase();
  personnelNameInput.setSelectionRange(start, end);
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
  if (!userRoleSelect.value) {
    userRoleSelect.style.borderColor = "#ef4444";
    alert("Lütfen bir rol seçin!");
    return;
  }
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
  const roleChanged = userRoleSelect.value !== initialRole && initialRole !== "";
  if (roleChanged) {
    window.electronAPI.restartApp(settings);
  } else {
    window.electronAPI.saveSettings(settings).then(() => {
      window.close();
    });
  }
};
