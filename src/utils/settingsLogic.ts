import { showToast } from './toastUtils'

export function initSettingsLogic(
    api: any,
    elements: any,
    refreshSidebarProfile: () => void
) {
    const {
        sPersonnelName, sUserRole, sShortcutClear, sShortcutCopy,
        sPopupSize, sPopupTimeout, sAutoStart, sPreventDuplicate, sLogoutBtn
    } = elements

    let initialRole = ''
    const logoutLabel = 'Oturumdan \u00c7\u0131k\u0131\u015f Yap'

    async function loadSettingsToUI() {
        const s = await api.getSettings()

        sPersonnelName.value = (s.personnelName || '').toUpperCase()
        let displayRole = s.role
        if (displayRole === 'kargo_kabul') displayRole = 'Kargo Kabul'
        else if (displayRole === 'mh') displayRole = 'M\u00fc\u015fteri Hizmetleri'
        else if (displayRole === 'admin') displayRole = 'Y\u00f6netici'
        sUserRole.value = displayRole || ''
        initialRole = s.role || ''

        sShortcutClear.value = s.shortcuts?.clearCache || 'CommandOrControl+Shift+X'
        sShortcutCopy.value = s.shortcuts?.toggleMonitoring || 'CommandOrControl+Shift+C'

        sPopupSize.value = String(s.popupSizeLevel || 2)
        sPopupTimeout.value = String(s.popupTimeout || 5000)
        sAutoStart.checked = s.autoStartEnabled || false
        sPreventDuplicate.checked = s.preventDuplicatePopup || false

        if (sLogoutBtn) {
            sLogoutBtn.textContent = logoutLabel
        }
    }

    // Auto-save logic
    async function saveCurrentSettings() {
        const currentSettings = await api.getSettings()
        const settingsToSave = {
            ...currentSettings,
            personnelName: sPersonnelName.value.trim(),
            role: initialRole,
            shortcuts: {
                clearCache: sShortcutClear.value,
                toggleMonitoring: sShortcutCopy.value
            },
            popupSizeLevel: parseInt(sPopupSize.value),
            popupTimeout: parseInt(sPopupTimeout.value),
            autoStartEnabled: sAutoStart.checked,
            preventDuplicatePopup: sPreventDuplicate.checked
        }

        try {
            await api.saveSettings(settingsToSave)
            refreshSidebarProfile()
        } catch (e: any) {
            showToast('Ayarlar kaydedilirken hata oluştu.', 'error')
        }
    }

    let saveTimeout: NodeJS.Timeout | null = null
    function triggerAutoSave(debounceMs = 0) {
        if (saveTimeout) clearTimeout(saveTimeout)
        if (debounceMs > 0) {
            saveTimeout = setTimeout(saveCurrentSettings, debounceMs)
        } else {
            saveCurrentSettings()
        }
    }

    sPersonnelName.addEventListener('input', () => {
        const start = sPersonnelName.selectionStart
        const end = sPersonnelName.selectionEnd
        sPersonnelName.value = sPersonnelName.value.replace(/\s/g, '').toUpperCase()
        sPersonnelName.setSelectionRange(start, end)
        triggerAutoSave(500) // 500ms debounce
    })

    sPopupSize.addEventListener('change', () => triggerAutoSave(0))
    sPopupTimeout.addEventListener('input', () => triggerAutoSave(500))
    sAutoStart.addEventListener('change', () => triggerAutoSave(0))
    sPreventDuplicate.addEventListener('change', () => triggerAutoSave(0))

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
                triggerAutoSave(0) // Save instantly on shortcut capture
            }
        }
    }

    setupShortcutRecorder(sShortcutClear)
    setupShortcutRecorder(sShortcutCopy)

    if (sLogoutBtn) {
        sLogoutBtn.onclick = async () => {
            const confirmed = await (window as any).showConfirm(
                'Oturumu Kapat',
                'Oturumdan çıkış yapmak istiyor musunuz?',
                'Çıkış Yap'
            )
            if (!confirmed) return

            try {
                await api.logout()
            } catch (e: any) {
                showToast('Oturum kapatılırken hata oluştu.', 'error')
            }
        }
    }

    return { loadSettingsToUI }
}
