import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0725546377",
  appId: "1:196125719238:web:20bb27ba571266ce7cf5c7",
  apiKey: "AIzaSyDRT4L2rvQaIYs5vZ64svVDTitXeUIZoqQ",
  authDomain: "gen-lang-client-0725546377.firebaseapp.com",
  storageBucket: "gen-lang-client-0725546377.firebasestorage.app",
  messagingSenderId: "196125719238"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-remixferryservic-37217526-3de2-4554-9670-b454bffb7493");

window.FirebaseDB = {
    db,
    
    subscribeToCustomStops(callback) {
        return onSnapshot(collection(db, "custom_bus_stops"), (snapshot) => {
            const stops = [];
            snapshot.forEach((doc) => stops.push(doc.data()));
            callback(stops);
        }, (error) => {
            console.error("Firebase custom stops subscription error:", error);
        });
    },
    
    async deleteCustomStop(id) {
        try {
            await deleteDoc(doc(db, "custom_bus_stops", String(id)));
        } catch(e) {
            console.error("Firebase custom stop delete error:", e);
        }
    },
    async saveCustomStop(stop) {
        try {
            await setDoc(doc(db, "custom_bus_stops", String(stop.id)), stop);
        } catch(e) {
            console.error("Firebase custom stop save error:", e);
        }
    },
    subscribeToRoutes(callback) {
        return onSnapshot(collection(db, "routes"), (snapshot) => {
            const routes = [];
            snapshot.forEach((doc) => routes.push(doc.data()));
            routes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            callback(routes);
        }, (error) => {
            console.error("Firebase routes subscription error:", error);
        });
    },
    async saveRoute(route) {
        try {
            await setDoc(doc(db, "routes", route.id), route);
        } catch(e) {
            console.error("Firebase save error:", e);
        }
    },
    async deleteRoute(routeId) {
        try {
            await deleteDoc(doc(db, "routes", routeId));
        } catch(e) {
            console.error("Firebase delete error:", e);
        }
    },
    async syncAll(routes) {
        try {
            for (const r of routes) {
                await setDoc(doc(db, "routes", r.id), r);
            }
        } catch(e) {
            console.error("Firebase syncAll error:", e);
        }
    }
};

window.dispatchEvent(new Event('FirebaseReady'));
