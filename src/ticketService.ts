import {
    collection,
    addDoc,
    updateDoc,
    doc,
    onSnapshot,
    query,
    where,
    getDocs,
    orderBy,
    serverTimestamp,
    Timestamp,
    Unsubscribe,
    limit,
    increment
} from 'firebase/firestore'
import { db } from './firebaseConfig'

// ── Types ───────────────────────────────────────────────────────────
export interface Ticket {
    id?: string
    serial: string
    model_name: string
    model_color: string
    missing_type: 'address' | 'fault_form' | 'contact' | 'other'
    note: string
    customer_name: string
    aras_code: string
    phone_number: string
    created_by: string
    created_at: Timestamp | null
    status: 'pending' | 'in_progress' | 'completed'
    response: string
    responded_by: string
    responded_at: Timestamp | null
}

const TICKETS_COLLECTION = 'tickets'

// ── Create ──────────────────────────────────────────────────────────
export async function createTicket(data: {
    serial: string
    model_name: string
    model_color: string
    missing_type: string
    note: string
    customer_name: string
    aras_code: string
    phone_number: string
    created_by: string
}): Promise<string> {
    const docRef = await addDoc(collection(db, TICKETS_COLLECTION), {
        ...data,
        created_at: serverTimestamp(),
        status: 'pending',
        response: '',
        responded_by: '',
        responded_at: null
    })

    // Give XP to Kargo Kabul creator (5 XP per ticket creation)
    try {
        const q = query(collection(db, 'users'), where('fullName', '==', data.created_by))
        const snapshot = await getDocs(q)
        if (!snapshot.empty) {
            const userId = snapshot.docs[0].id
            await updateDoc(doc(db, 'users', userId), {
                xp: increment(5)
            })
        }
    } catch (e) { console.error('Error adding xp:', e) }

    return docRef.id
}

// ── Claim (MH üstlenir) ────────────────────────────────────────────
export async function claimTicket(ticketId: string, personnelName: string): Promise<void> {
    await updateDoc(doc(db, TICKETS_COLLECTION, ticketId), {
        status: 'in_progress',
        responded_by: personnelName
    })
}

// ── Complete (MH cevap yazar) ───────────────────────────────────────
export async function completeTicket(ticketId: string, response: string): Promise<void> {
    const ticketDoc = await getDocs(query(collection(db, TICKETS_COLLECTION), where('__name__', '==', ticketId)))
    let respondedBy = ''
    if (!ticketDoc.empty) {
        respondedBy = ticketDoc.docs[0].data().responded_by
    }

    await updateDoc(doc(db, TICKETS_COLLECTION, ticketId), {
        status: 'completed',
        response,
        responded_at: serverTimestamp()
    })

    // Give XP to MH (10 XP per ticket answer)
    if (respondedBy) {
        try {
            const q = query(collection(db, 'users'), where('fullName', '==', respondedBy))
            const snapshot = await getDocs(q)
            if (!snapshot.empty) {
                const userId = snapshot.docs[0].id
                await updateDoc(doc(db, 'users', userId), {
                    xp: increment(10)
                })
            }
        } catch (e) { console.error('Error adding xp:', e) }
    }
}

// ── Reopen (MH tekrar düzenler) ─────────────────────────────────────
export async function reopenTicket(ticketId: string): Promise<void> {
    await updateDoc(doc(db, TICKETS_COLLECTION, ticketId), {
        status: 'in_progress',
        response: '' // Cevabı boşaltıyoruz ki tekrar düzenleyebilsin
    })
}

// ── Update Details (Ortak Düzenleme) ───────────────────────────────
export async function updateTicketDetails(ticketId: string, details: Partial<Ticket>): Promise<void> {
    await updateDoc(doc(db, TICKETS_COLLECTION, ticketId), {
        ...details
    })
}

// ── Real-time Listeners ─────────────────────────────────────────────

/**
 * Kargo Kabul: Kendi oluşturduğu talepleri dinler
 */
export function subscribeAsKargoKabul(
    personnelName: string,
    callback: (tickets: Ticket[]) => void
): Unsubscribe {
    const q = query(
        collection(db, TICKETS_COLLECTION),
        orderBy('created_at', 'desc'),
        limit(200)
    )

    return onSnapshot(q, (snapshot) => {
        const tickets = snapshot.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                ...data,
                created_at: data.created_at ? data.created_at.toMillis() : null,
                responded_at: data.responded_at ? data.responded_at.toMillis() : null
            }
        });

        tickets.sort((a, b) => {
            const timeA = a.created_at || 0;
            const timeB = b.created_at || 0;
            return timeB - timeA;
        });

        callback(tickets as any)
    }, (error) => {
        console.error('Firestore listener error (KK):', error)
    })
}

/**
 * MH: Tüm pending + in_progress talepleri dinler
 */
export function subscribeAsMH(
    callback: (tickets: Ticket[]) => void
): Unsubscribe {
    const q = query(
        collection(db, TICKETS_COLLECTION),
        orderBy('created_at', 'desc'),
        limit(200)
    )

    return onSnapshot(q, (snapshot) => {
        const tickets = snapshot.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                ...data,
                created_at: data.created_at ? data.created_at.toMillis() : null,
                responded_at: data.responded_at ? data.responded_at.toMillis() : null
            }
        });

        tickets.sort((a, b) => {
            const timeA = a.created_at || 0;
            const timeB = b.created_at || 0;
            return timeB - timeA;
        });

        callback(tickets as any)
    }, (error) => {
        console.error('Firestore listener error (MH):', error)
    })
}
