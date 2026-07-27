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
export interface PriorityDevice {
    id?: string
    customer_name: string
    serial: string
    description: string
    created_by: string
    created_at: Timestamp | null
}

const PRIORITY_COLLECTION = 'priority_devices'

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
        resolved_at: null,
        recipients: [],      // Personnel who received the popup
        dismissed_by: []     // Personnel who clicked "Bende Değil"
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

/** Called by main process when opening the popup for a recipient. */
export async function markDeviceCallRecipient(id: string, name: string): Promise<void> {
    await updateDoc(doc(db, DEVICE_CALLS_COLLECTION, id), {
        recipients: arrayUnion(name)
    })
}

/** Called when a recipient clicks "Bende Değil". */
export async function dismissDeviceCallBy(id: string, name: string): Promise<void> {
    await updateDoc(doc(db, DEVICE_CALLS_COLLECTION, id), {
        dismissed_by: arrayUnion(name)
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
