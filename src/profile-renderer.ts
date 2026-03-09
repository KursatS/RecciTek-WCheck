import { collection, query, getDocs, orderBy, updateDoc, doc } from 'firebase/firestore'
import { db } from './firebaseConfig'

const api = (window as any).electronAPI

const elMyLevel = document.getElementById('my-level')!
const elMyName = document.getElementById('my-name')!
const elMyRole = document.getElementById('my-role')!
const elMyXp = document.getElementById('my-xp')!
const elNextLevelXp = document.getElementById('next-level-xp')!
const elXpFill = document.getElementById('my-xp-fill')!
const scoreboardContainer = document.getElementById('scoreboard')!
const filterBtns = document.querySelectorAll<HTMLButtonElement>('.filter-btn')

let allUsers: any[] = []
let currentUsername = ''
let roleFilter: 'all' | 'mh' | 'kargo_kabul' = 'all'

const ROLE_LABELS: Record<string, string> = {
    admin: 'Yönetici',
    mh: 'Müşteri Hizmetleri',
    kargo_kabul: 'Kargo Kabul'
}

const RANK_ICONS = ['🥇', '🥈', '🥉']

function calculateLevel(xp: number): { level: number, nextXp: number } {
    let level = 1
    let threshold = 100

    while (xp >= threshold) {
        level++
        threshold += 100 * (level * 0.5)
    }
    return { level, nextXp: threshold }
}

function renderScoreboard(users: any[]) {
    const filtered = roleFilter === 'all'
        ? users
        : users.filter(u => {
            // Admin is treated as kargo_kabul for display
            const r = u.role === 'admin' ? 'kargo_kabul' : u.role
            return r === roleFilter
        })

    scoreboardContainer.innerHTML = ''

    if (filtered.length === 0) {
        scoreboardContainer.innerHTML = `<div class="empty-filter">Bu rol için kayıtlı çalışan yok.</div>`
        return
    }

    filtered.forEach((user, index) => {
        const rank = users.indexOf(user) + 1 // global rank (by XP desc)
        const isMe = user.username === currentUsername

        const row = document.createElement('div')
        const rankClass = rank <= 3 ? `rank-${rank}` : ''
        row.className = `score-row ${rankClass}`
        row.style.setProperty('--i', String(index))

        if (isMe) {
            row.style.background = 'rgba(56, 189, 248, 0.08)'
            row.style.borderLeft = '3px solid #38bdf8'
        }

        const icon = rank <= 3 ? RANK_ICONS[rank - 1] : `#${rank}`
        const roleLabel = ROLE_LABELS[user.role] || 'Kargo Kabul'
        const calcLvl = calculateLevel(user.xp || 0).level

        row.innerHTML = `
            <div class="score-rank">${icon}</div>
            <div class="score-name">${user.fullName || user.username} ${isMe ? '<span style="font-size:0.75rem;color:#38bdf8;">(Sen)</span>' : ''}</div>
            <div class="score-role">${roleLabel}</div>
            <div class="score-level">Lvl ${calcLvl}</div>
            <div class="score-xp">${user.xp || 0} XP</div>
        `
        scoreboardContainer.appendChild(row)
    })
}

// Filter button click handlers
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        roleFilter = (btn.dataset.role || 'all') as typeof roleFilter
        renderScoreboard(allUsers)
    })
})

async function loadProfile() {
    const settings = await api.getSettings()
    currentUsername = settings.username || ''

    try {
        const q = query(collection(db, 'users'))
        const snapshot = await getDocs(q)

        const users: any[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
        users.sort((a, b) => (b.xp || 0) - (a.xp || 0))
        allUsers = users

        const me = users.find(u => u.username === currentUsername)
        if (me) {
            const { level, nextXp } = calculateLevel(me.xp || 0)

            // Auto-sync level in DB if changed
            if (me.level !== level) {
                await updateDoc(doc(db, 'users', me.id), { level })
            }

            elMyLevel.textContent = String(level)
            elMyName.textContent = me.fullName || me.username
            elMyRole.textContent = ROLE_LABELS[me.role] || 'Kargo Kabul'
            elMyXp.textContent = String(me.xp || 0)
            elNextLevelXp.textContent = String(nextXp)

            const progress = ((me.xp || 0) / nextXp) * 100
            // Delay for entrance animation
            setTimeout(() => {
                elXpFill.style.width = `${Math.min(100, progress)}%`
            }, 400)
        }

        renderScoreboard(allUsers)

    } catch (e) {
        console.error('Error loading profile/scoreboard:', e)
        scoreboardContainer.innerHTML = `<div style="padding:16px; color:#ef4444;">Veriler yüklenemedi.</div>`
    }
}

loadProfile()
