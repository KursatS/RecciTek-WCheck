import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
    apiKey: 'AIzaSyBbKdmGohakaU5woTt90BSNeH2DoVD3XNo',
    authDomain: 'reccitek-wcheck.firebaseapp.com',
    projectId: 'reccitek-wcheck',
    storageBucket: 'reccitek-wcheck.firebasestorage.app',
    messagingSenderId: '231625980465',
    appId: '1:231625980465:web:d1f93529f724c68088b310'
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
