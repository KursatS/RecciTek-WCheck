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
    increment,
    deleteDoc,
    arrayUnion
} from 'firebase/firestore'
import { db } from './firebaseConfig'

//
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
    is_hidden?: boolean
    hidden_by?: string
    last_contact_attempt_at?: Timestamp | null
}

export interface PriorityDevice {
    id?: string
    customer_name: string
    serial: string
    description: string
    created_by: string
    created_at: Timestamp | null
}

const TICKETS_COLLECTION = 'tickets'
const PRIORITY_COLLECTION = 'priority_devices'

//
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
    const missingTypeTokens = data.missing_type
        .split(',')
        .map(token => token.trim())
        .filter(Boolean)

    const docRef = await addDoc(collection(db, TICKETS_COLLECTION), {
        ...data,
        missing_type_tokens: missingTypeTokens,
        created_at: serverTimestamp(),
        status: 'pending',
        response: '',
        responded_by: '',
        responded_at: null,
        action_history: [{
            action: 'Oluşturuldu',
            user: data.created_by,
            timestamp: Date.now()
        }]
    })

    try {
        const q = query(collection(db, 'users'), where('fullName', '==', data.created_by))
        const snapshot = await getDocs(q)
        if (!snapshot.empty) {
            await updateDoc(doc(db, 'users', snapshot.docs[0].id), { xp: increment(5) })
        }
    } catch (e) { console.error('Error adding xp:', e) }

    return docRef.id
}

//
export async function claimTicket(ticketId: string, personnelName: string): Promise<void> {
    await updateDoc(doc(db, TICKETS_COLLECTION, ticketId), {
        status: 'in_progress',
        responded_by: personnelName,
        action_history: arrayUnion({
            action: 'Üstlendi',
            user: personnelName,
            timestamp: Date.now()
        })
    })
}

//
export async function completeTicket(ticketId: string, response: string): Promise<void> {
    const ticketDoc = await getDocs(query(collection(db, TICKETS_COLLECTION), where('__name__', '==', ticketId)))
    let respondedBy = ''
    let xp_awarded = false
    if (!ticketDoc.empty) {
        const data = ticketDoc.docs[0].data()
        respondedBy = data.responded_by
        xp_awarded = data.xp_awarded || false
    }

    await updateDoc(doc(db, TICKETS_COLLECTION, ticketId), {
        status: 'completed',
        response,
        responded_at: serverTimestamp(),
        xp_awarded: true,
        action_history: arrayUnion({
            action: 'Tamamlandı',
            user: respondedBy || 'Bilinmiyor',
            timestamp: Date.now()
        })
    })

    if (respondedBy && !xp_awarded) {
        try {
            const q = query(collection(db, 'users'), where('fullName', '==', respondedBy))
            const snapshot = await getDocs(q)
            if (!snapshot.empty) {
                await updateDoc(doc(db, 'users', snapshot.docs[0].id), { xp: increment(10) })
            }
        } catch (e) { console.error('Error adding xp:', e) }
    }
}

//
export async function reopenTicket(ticketId: string, personnelName: string): Promise<void> {
    await updateDoc(doc(db, TICKETS_COLLECTION, ticketId), {
        status: 'in_progress',
        action_history: arrayUnion({
            action: 'Yeniden Açtı',
            user: personnelName,
            timestamp: Date.now()
        })
        // Do not clear response so the user can edit their previous response.
    })
}

//
export async function hideTicket(ticketId: string, personnelName: string): Promise<void> {
    await updateDoc(doc(db, TICKETS_COLLECTION, ticketId), {
        is_hidden: true,
        hidden_by: personnelName
    })
}

export async function unhideTicket(ticketId: string): Promise<void> {
    await updateDoc(doc(db, TICKETS_COLLECTION, ticketId), {
        is_hidden: false,
        hidden_by: ''
    })
}

//
export async function deleteTicket(ticketId: string): Promise<void> {
    await deleteDoc(doc(db, TICKETS_COLLECTION, ticketId))
}

//
export async function updateTicketDetails(ticketId: string, details: Partial<Ticket>): Promise<void> {
    await updateDoc(doc(db, TICKETS_COLLECTION, ticketId), { ...details })
}

export async function markTicketUnreachable(ticketId: string, personnelName: string): Promise<void> {
    const ticketDoc = await getDocs(query(collection(db, TICKETS_COLLECTION), where('__name__', '==', ticketId)))
    if (!ticketDoc.empty) {
        await updateDoc(doc(db, TICKETS_COLLECTION, ticketId), {
            status: 'pending',
            responded_by: '',
            last_contact_attempt_at: serverTimestamp(),
            action_history: arrayUnion({
                action: 'Ulaşılamadı Olarak İşaretledi',
                user: personnelName,
                timestamp: Date.now()
            })
        })
    }
}

//
export function subscribeAsKargoKabul(
    personnelName: string,
    callback: (tickets: Ticket[]) => void
): Unsubscribe {
    const q = query(collection(db, TICKETS_COLLECTION), orderBy('created_at', 'desc'), limit(200))
    return onSnapshot(q, (snapshot) => {
        const tickets = snapshot.docs.map(d => {
            const data = d.data()
            return { id: d.id, ...data, created_at: data.created_at?.toMillis?.() ?? null, responded_at: data.responded_at?.toMillis?.() ?? null }
        })
        tickets.sort((a: any, b: any) => (b.created_at || 0) - (a.created_at || 0))
        callback(tickets as any)
    }, (error) => console.error('Firestore listener error (KK):', error))
}

export function subscribeAsMH(
    callback: (tickets: Ticket[]) => void
): Unsubscribe {
    const q = query(collection(db, TICKETS_COLLECTION), orderBy('created_at', 'desc'), limit(200))
    return onSnapshot(q, (snapshot) => {
        const tickets = snapshot.docs.map(d => {
            const data = d.data()
            return { id: d.id, ...data, created_at: data.created_at?.toMillis?.() ?? null, responded_at: data.responded_at?.toMillis?.() ?? null }
        })
        tickets.sort((a: any, b: any) => (b.created_at || 0) - (a.created_at || 0))
        callback(tickets as any)
    }, (error) => console.error('Firestore listener error (MH):', error))
}

//
export async function addPriorityDevice(data: {
    customer_name: string
    serial: string
    description: string
    created_by: string
}): Promise<string> {
    const docRef = await addDoc(collection(db, PRIORITY_COLLECTION), {
        ...data,
        serial: data.serial.trim().toUpperCase(),
        created_at: serverTimestamp()
    })
    return docRef.id
}

export async function deletePriorityDevice(id: string): Promise<void> {
    await deleteDoc(doc(db, PRIORITY_COLLECTION, id))
}

export async function updatePriorityDevice(id: string, data: Partial<PriorityDevice>): Promise<void> {
    if (data.serial) {
        data.serial = data.serial.trim().toUpperCase()
    }
    await updateDoc(doc(db, PRIORITY_COLLECTION, id), { ...data })
}

export function subscribeToPriorityDevices(
    callback: (devices: PriorityDevice[]) => void
): Unsubscribe {
    const q = query(collection(db, PRIORITY_COLLECTION), orderBy('created_at', 'desc'))
    return onSnapshot(q, (snapshot) => {
        const devices = snapshot.docs.map(d => {
            const data = d.data()
            return { id: d.id, ...data, created_at: data.created_at?.toMillis?.() ?? null }
        })
        callback(devices as any)
    }, (error) => console.error('Firestore listener error (PriorityDevices):', error))
}
//
export async function getUsers(): Promise<any[]> {
    const q = query(collection(db, 'users'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(d => {
        const data = d.data()
        const { password, ...safeUser } = data
        return { id: d.id, ...safeUser }
    })
}

export async function createUser(data: { username: string, password: string, fullName: string, role: string }): Promise<string> {
    const docRef = await addDoc(collection(db, 'users'), {
        ...data,
        level: 1,
        xp: 0,
        createdAt: serverTimestamp()
    })
    return docRef.id
}

export async function updateUser(id: string, data: any): Promise<void> {
    await updateDoc(doc(db, 'users', id), { ...data, updatedAt: serverTimestamp() })
}

export async function deleteUser(id: string): Promise<void> {
    await deleteDoc(doc(db, 'users', id))
}

export async function resetUserXp(id: string): Promise<void> {
    await updateDoc(doc(db, 'users', id), { xp: 0, level: 1 })
}

const DEVICE_CALLS_COLLECTION = 'device_calls'

export async function createDeviceCall(data: {
    serial: string
    model_name: string
    customer_name?: string
    created_by: string
}): Promise<string> {
    const docRef = await addDoc(collection(db, DEVICE_CALLS_COLLECTION), {
        serial: data.serial.trim().toUpperCase(),
        model_name: data.model_name.trim().toUpperCase(),
        customer_name: (data.customer_name || '').trim(),
        created_by: data.created_by,
        created_at: serverTimestamp(),
        status: 'active',
        resolved_by: '',
        resolved_at: null
    })
    return docRef.id
}

export async function resolveDeviceCall(id: string, resolved_by: string): Promise<void> {
    await updateDoc(doc(db, DEVICE_CALLS_COLLECTION, id), {
        status: 'resolved',
        resolved_by: resolved_by,
        resolved_at: serverTimestamp()
    })
}

export async function cancelDeviceCall(id: string): Promise<void> {
    await updateDoc(doc(db, DEVICE_CALLS_COLLECTION, id), {
        status: 'cancelled',
        resolved_at: serverTimestamp()
    })
}

export function subscribeToDeviceCalls(
    callback: (calls: any[]) => void
): Unsubscribe {
    const q = query(collection(db, DEVICE_CALLS_COLLECTION), orderBy('created_at', 'desc'), limit(50))
    return onSnapshot(q, (snapshot) => {
        const calls = snapshot.docs.map(d => {
            const data = d.data()
            return {
                id: d.id,
                ...data,
                created_at: data.created_at?.toMillis?.() ?? null,
                resolved_at: data.resolved_at?.toMillis?.() ?? null
            }
        })
        callback(calls)
    }, (error) => console.error('Firestore listener error (DeviceCalls):', error))
}

