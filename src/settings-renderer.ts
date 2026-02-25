export { }
const popupSize = document.getElementById('popup-size') as HTMLSelectElement
const popupTimeout = document.getElementById('popup-timeout') as HTMLInputElement
const autoStart = document.getElementById('auto-start') as HTMLInputElement
const preventDuplicate = document.getElementById('prevent-duplicate') as HTMLInputElement
const shortcutClear = document.getElementById('shortcut-clear') as HTMLInputElement
const shortcutCopy = document.getElementById('shortcut-copy') as HTMLInputElement
const personnelNameInput = document.getElementById('personnel-name') as HTMLInputElement
const userRoleSelect = document.getElementById('user-role') as HTMLSelectElement
const saveBtn = document.getElementById('save-btn') as HTMLButtonElement

    // Load Settings
    ; (window as any).electronAPI.getSettings().then((settings: any) => {
        popupSize.value = settings.popupSizeLevel || 2
        popupTimeout.value = settings.popupTimeout || 5000
        autoStart.checked = settings.autoStartEnabled || false
        preventDuplicate.checked = settings.preventDuplicatePopup || false
        shortcutClear.value = settings.shortcuts?.clearCache || 'CommandOrControl+Shift+X'
        shortcutCopy.value = settings.shortcuts?.toggleMonitoring || 'CommandOrControl+Shift+C'
        personnelNameInput.value = settings.personnelName || ''
        userRoleSelect.value = settings.role || ''
    })

// Shortcut Recorder Logic
function setupShortcutRecorder(input: HTMLInputElement) {
    input.onkeydown = (e) => {
        e.preventDefault()
        const keys: string[] = []
        if (e.ctrlKey || e.metaKey) keys.push('CommandOrControl')
        if (e.shiftKey) keys.push('Shift')
        if (e.altKey) keys.push('Alt')

        if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
            keys.push(e.key.toUpperCase())
            input.value = keys.join('+')
        }
    }
}

setupShortcutRecorder(shortcutClear)
setupShortcutRecorder(shortcutCopy)

saveBtn.onclick = () => {
    if (!userRoleSelect.value) {
        userRoleSelect.style.borderColor = '#ef4444'
        alert('Lütfen bir rol seçin!')
        return
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
    }

        ; (window as any).electronAPI.saveSettings(settings).then(() => {
            window.close()
        })
}
