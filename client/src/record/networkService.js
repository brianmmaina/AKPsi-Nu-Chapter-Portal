// Professional Network backend: Firebase (project nu-chapter-connect-portal).
// Native port of the portal's Google sign-in + Firestore directory + mentor
// requests, per the design handoff's akpsi-api.js behavioral spec.

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { getFirestore, collection, getDocs, addDoc } from 'firebase/firestore';
import api from '../api';

// In production the Google auth handler is served from our own origin
// (vercel.json proxies /__/auth/* to firebaseapp.com). Keeping it first-party
// stops Safari's storage partitioning from stranding sign-in on
// firebaseapp.com with "missing initial state". Localhost keeps the
// firebaseapp.com handler since the dev server has no proxy for it.
const isLocalHost =
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1'].includes(window.location.hostname);

// Public client-SDK config — same project as client/public/portal.
const firebaseConfig = {
  apiKey: 'AIzaSyBCcsZcqWZSL3EjJ-9e5LE_T0BT8VfSCP0',
  authDomain: isLocalHost ? 'nu-chapter-connect-portal.firebaseapp.com' : window.location.host,
  projectId: 'nu-chapter-connect-portal',
  storageBucket: 'nu-chapter-connect-portal.firebasestorage.app',
  messagingSenderId: '107094410758',
  appId: '1:107094410758:web:690ab70eb405cdd57ae587',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/** Fills empty profile_image_url on the roster; manual uploads win server-side. */
export const syncPhoto = (email, photoUrl) =>
  api.post('/brothers/sync-photo', { email, photoUrl });

export async function netSignIn() {
  const provider = new GoogleAuthProvider();
  const res = await signInWithPopup(auth, provider);
  const u = res.user;
  if (u && u.email && u.photoURL) {
    syncPhoto(u.email, u.photoURL).catch(() => {});
  }
  return {
    name: u.displayName || '',
    email: (u.email || '').toLowerCase(),
    photo: u.photoURL || '',
  };
}

export async function netSignOut() {
  await signOut(auth);
}

export function netCurrentUser() {
  return new Promise((resolve) => {
    const un = onAuthStateChanged(auth, (u) => {
      un();
      resolve(
        u
          ? { name: u.displayName || '', email: (u.email || '').toLowerCase(), photo: u.photoURL || '' }
          : null,
      );
    });
  });
}

export async function loadAlumniDirectory() {
  const snap = await getDocs(collection(db, 'alumni'));
  return snap.docs.map((d) => ({ fbId: d.id, ...d.data() }));
}

export async function loadBrotherDirectory() {
  const snap = await getDocs(collection(db, 'brothers'));
  return snap.docs.map((d) => ({ fbId: d.id, ...d.data() }));
}

export async function requestMentor(mentor, requester) {
  await addDoc(collection(db, 'mentorRequests'), {
    type: 'mentor',
    name: mentor.name || '',
    email: (mentor.email || '').toLowerCase(),
    requestedByName: requester && requester.name ? requester.name : '',
    requestedByEmail: requester && requester.email ? requester.email : '',
    createdAt: new Date().toISOString(),
    status: 'pending',
  });
}
