import { collection, query, getDocs, orderBy, updateDoc, doc, where } from 'firebase/firestore'
import { db } from './firebaseConfig'

const api = (window as any).electronAPI

const elMyLevel = document.getElementById('my-level')!
const elMyName = document.getElementById('my-name')!
const elMyRole = document.getElementById('my-role')!
const elMyXp = document.getElementById('my-xp')!
const elNextLevelXp = document.getElementById('next-level-xp')!
const elXpFill = document.getElementById('my-xp-fill')!
const scoreboardContainer = document.getElementById('scoreboard')!

// Level Calculation Logic: Level 1 = 0-100 XP, Level 2 = 100-250 XP, Level 3 = 250-450 XP, Level 4 = 450-700
function calculateLevel(xp: number): { level: number, currentXp: number, nextXp: number } {
    let level = 1
    let threshold = 100
    let lastThreshold = 0

    while (xp >= threshold) {
        level++
        lastThreshold = threshold
        threshold += 100 * (level * 0.5) // Her seviye gitgide zorlaşır
    }

    return {
        level,
        currentXp: xp,
        nextXp: threshold
    }
}

async function loadProfile() {
    const settings = await api.getSettings()
    const currentUsername = settings.username

    try {
        // Fetch all users to display scoreboard and find own user
        const q = query(collection(db, 'users'))
        const snapshot = await getDocs(q)

        const users: any[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))

        // Sort by XP descending
        users.sort((a, b) => (b.xp || 0) - (a.xp || 0))

        const me = users.find(u => u.username === currentUsername)
        if (me) {
            const xpInfo = calculateLevel(me.xp || 0)

            // Auto-update level in DB if it changed
            if (me.level !== xpInfo.level) {
                await updateDoc(doc(db, 'users', me.id), { level: xpInfo.level })
            }

            elMyLevel.textContent = String(xpInfo.level)
            elMyName.textContent = me.fullName || me.username

            let roleDisplay = 'Kargo Kabul'
            if (me.role === 'admin') roleDisplay = 'Yönetici'
            else if (me.role === 'mh') roleDisplay = 'Müşteri Hizmetleri'

            elMyRole.textContent = roleDisplay
            elMyXp.textContent = String(xpInfo.currentXp)
            elNextLevelXp.textContent = String(xpInfo.nextXp)

            const progress = (xpInfo.currentXp / xpInfo.nextXp) * 100
            elXpFill.style.width = `${Math.min(100, progress)}%`
        }

        // Render Scoreboard
        scoreboardContainer.innerHTML = ''
        users.forEach((user, index) => {
            const rank = index + 1
            const isMe = user.username === currentUsername

            const row = document.createElement('div')
            row.className = `score-row rank-${rank}`
            if (isMe) {
                row.style.background = 'rgba(56, 189, 248, 0.1)'
            }

            let roleDisplay = 'Kargo Kabul'
            if (user.role === 'admin') roleDisplay = 'Admin'
            else if (user.role === 'mh') roleDisplay = 'MH'

            const calculatedLvl = calculateLevel(user.xp || 0).level

            row.innerHTML = `
                <div class="score-rank">#${rank}</div>
                <div class="score-name">${user.fullName || user.username} ${isMe ? '(Sen)' : ''}</div>
                <div class="score-role">${roleDisplay}</div>
                <div class="score-level">Lvl ${calculatedLvl}</div>
                <div class="score-xp">${user.xp || 0} XP</div>
            `
            scoreboardContainer.appendChild(row)
        })

    } catch (e) {
        console.error('Error loading profile/scoreboard:', e)
        scoreboardContainer.innerHTML = `<div style="padding:16px; color:#ef4444;">Veriler yüklenemedi.</div>`
    }
}

loadProfile()
