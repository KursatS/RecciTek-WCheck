import {
    collection,
    addDoc,
    updateDoc,
    doc,
    onSnapshot,
    query,
    where,
    orderBy,
    serverTimestamp,
    Timestamp,
    Unsubscribe
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
    await updateDoc(doc(db, TICKETS_COLLECTION, ticketId), {
        status: 'completed',
        response,
        responded_at: serverTimestamp()
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
        collection(db, TICKETS_COLLECTION)
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
        collection(db, TICKETS_COLLECTION)
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
