import { showToast } from './toastUtils'

export function initSettingsLogic(
    api: any, 
    elements: any,
    refreshSidebarProfile: () => void
) {
    const {
        sPersonnelName, sUserRole, sShortcutClear, sShortcutCopy,
        sPopupSize, sPopupTimeout, sAutoStart, sPreventDuplicate, sSaveBtn
    } = elements

    let initialRole = ''

    async function loadSettingsToUI() {
        const s = await api.getSettings()
        
        // Profil
        sPersonnelName.value = (s.personnelName || '').toUpperCase()
        let displayRole = s.role
        if (displayRole === 'kargo_kabul') displayRole = 'Kargo Kabul'
        else if (displayRole === 'mh') displayRole = 'Müşteri Hizmetleri'
        else if (displayRole === 'admin') displayRole = 'Yönetici'
        sUserRole.value = displayRole || ''
        initialRole = s.role || ''

        // Kısayollar
        sShortcutClear.value = s.shortcuts?.clearCache || 'CommandOrControl+Shift+X'
        sShortcutCopy.value = s.shortcuts?.toggleMonitoring || 'CommandOrControl+Shift+C'

        // Popup ve Sistem
        sPopupSize.value = String(s.popupSizeLevel || 2)
        sPopupTimeout.value = String(s.popupTimeout || 5000)
        sAutoStart.checked = s.autoStartEnabled || false
        sPreventDuplicate.checked = s.preventDuplicatePopup || false
    }

    // Personel adı validasyonu (Sadece büyük harf, boşluksuz)
    sPersonnelName.addEventListener('input', () => {
        const start = sPersonnelName.selectionStart
        const end = sPersonnelName.selectionEnd
        sPersonnelName.value = sPersonnelName.value.replace(/\\s/g, '').toUpperCase()
        sPersonnelName.setSelectionRange(start, end)
    })

    // Kısayol kaydetme mantığı
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
    setupShortcutRecorder(sShortcutClear)
    setupShortcutRecorder(sShortcutCopy)

    sSaveBtn.onclick = async () => {
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
            showToast('Ayarlar başarıyla kaydedildi.', 'success')
            refreshSidebarProfile()
        } catch (e: any) {
            showToast('Ayarlar kaydedilirken hata oluştu.', 'error')
        }
    }

    return { loadSettingsToUI }
}
