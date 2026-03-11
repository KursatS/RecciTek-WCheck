export function initProfileLogic(
    api: any, 
    elements: any,
    personnelName: string,
    calculateLevel: (xp: number) => { level: number, nextXp: number },
    refreshSidebarProfile: () => void
) {
    const {
        scoreboardContainer,
        profileFilterBtns,
        pMyLevel,
        pMyName,
        pMyRole,
        pMyXp,
        pNextLevelXp,
        pXpFill
    } = elements

    async function loadProfileScoreboard() {
        const users = await api.getUsers()
        if (!users) return
        scoreboardContainer.innerHTML = ''
        users.sort((a: any, b: any) => (b.xp || 0) - (a.xp || 0))

        const activeRole = (Array.from(profileFilterBtns).find((b: any) => b.classList.contains('active')) as HTMLElement)?.dataset.role || 'all'

        let filtered = users
        if (activeRole !== 'all') filtered = filtered.filter((u: any) => u.role === activeRole)

        // Update profile banner with current user
        const currentUser = users.find((u: any) => u.fullName === personnelName || u.username === personnelName)
        if (currentUser) {
            const { level, nextXp } = calculateLevel(currentUser.xp || 0)
            const currentXp = currentUser.xp || 0
            pMyLevel.textContent = String(level)
            pMyName.textContent = currentUser.fullName || currentUser.username
            pMyRole.textContent = currentUser.role === 'mh' ? 'Müşteri Hizmetleri' : 'Kargo Kabul'
            pMyXp.textContent = String(currentXp)
            pNextLevelXp.textContent = String(nextXp)
            pXpFill.style.width = `${(currentXp / nextXp) * 100}%`
        }

        if (filtered.length === 0) {
            scoreboardContainer.innerHTML = '<div class="priority-empty">Kullanıcı bulunamadı.</div>'
            return
        }

        filtered.forEach((u: any, idx: number) => {
            const rank = idx + 1
            const { level } = calculateLevel(u.xp || 0)
            const roleLabel = u.role === 'mh' ? 'Müşteri Hizmetleri' : (u.role === 'admin' || u.username === 'KursatS' ? 'Yönetici' : 'Kargo Kabul')

            let medalIcon = `#${rank}`
            if (rank === 1) medalIcon = '🥇'
            else if (rank === 2) medalIcon = '🥈'
            else if (rank === 3) medalIcon = '🥉'

            const row = document.createElement('div')
            row.className = `score-row${rank <= 3 ? ' rank-' + rank : ''}`
            row.style.setProperty('--i', String(idx))
            row.innerHTML = `
                <div class="score-rank">${medalIcon}</div>
                <div class="score-name">${u.fullName || u.username}</div>
                <div class="score-role">${roleLabel}</div>
                <div class="score-level">Lv. ${level}</div>
                <div class="score-xp">${u.xp || 0} XP</div>
            `
            scoreboardContainer.appendChild(row)
        })
        refreshSidebarProfile()
    }

    profileFilterBtns.forEach((btn: any) => {
        btn.addEventListener('click', () => {
            profileFilterBtns.forEach((b: any) => b.classList.remove('active'))
            btn.classList.add('active')
            loadProfileScoreboard()
        })
    })

    return { loadProfileScoreboard }
}
