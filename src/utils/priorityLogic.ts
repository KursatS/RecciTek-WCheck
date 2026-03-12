export function initPriorityLogic(api: any, elements: any) {
    const { prioList, addPrioBtn, pSerial, pCustomer, pDesc } = elements

    async function loadPriorityDevices() {
        const devices = await api.getPriorityDevices()
        prioList.innerHTML = ''
        if (!devices || devices.length === 0) {
            prioList.innerHTML = '<div class="priority-empty">Kayıtlı öncelikli cihaz yok.</div>'
            return
        }
        devices.forEach((d: any) => {
            const item = document.createElement('div')
            item.className = 'priority-item'
            item.innerHTML = `
                <div class="priority-item-body">
                    <div class="priority-item-name">${d.customer_name}</div>
                    <div class="priority-item-serial">${d.serial}</div>
                    <div class="priority-item-desc">${d.description}</div>
                </div>
                <button class="btn-del-priority" onclick="deletePriority('${d.id}')">✕</button>
            `
            prioList.appendChild(item)
        })
    }

    addPrioBtn.onclick = async () => {
        const data = {
            serial: pSerial.value.trim().toUpperCase(),
            customer_name: pCustomer.value.trim() || 'Belirtilmedi',
            description: pDesc.value.trim()
        }
        if (!data.serial) return
        await api.addPriorityDevice(data)
        pSerial.value = ''; pCustomer.value = ''; pDesc.value = ''
        loadPriorityDevices()
    }

    // Global window function for deletion
    ;(window as any).deletePriority = async (id: string) => {
        await api.deletePriorityDevice(id)
        loadPriorityDevices()
    }

    return { loadPriorityDevices }
}
