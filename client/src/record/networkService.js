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
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
} from 'firebase/firestore';
import api from '../api';

// Serving the Google auth handler from our own origin is the better setup —
// it stops Safari's storage partitioning from stranding sign-in on
// firebaseapp.com with "missing initial state". That requires the host to
// proxy /__/auth/* through to firebaseapp.com, which is configured in
// vercel.json — and vercel.json is dead config here: the site is deployed as
// a Render static site, which ignores it and 404s the handler. Until the
// equivalent rewrite rules exist on Render (see README → Deployment), point
// authDomain at firebaseapp.com so sign-in works everywhere but Safari.

// Public client-SDK config (safe to ship; access is enforced by Firestore rules).
const firebaseConfig = {
  apiKey: 'AIzaSyBCcsZcqWZSL3EjJ-9e5LE_T0BT8VfSCP0',
  authDomain: 'nu-chapter-connect-portal.firebaseapp.com',
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
  return snap.docs.map((d) => ({ fbId: d.id, kind: 'alumni', ...d.data() }));
}

export async function loadBrotherDirectory() {
  const snap = await getDocs(collection(db, 'brothers'));
  return snap.docs.map((d) => ({ fbId: d.id, kind: 'brother', ...d.data() }));
}

// Matches the portal's own safeEmailKey(): lowercase, every dot -> underscore.
// Exported so every file doing role-collection lookups computes this
// identically — a second, slightly different implementation drifting into
// another file is exactly the kind of bug the isApproved() regex fix caught.
export const emailDocId = (email) => (email || '').toLowerCase().trim().replace(/\./g, '_');

/** approvedUsers doc for this email, or null if the account isn't approved. */
export async function loadApprovedUser(email) {
  const snap = await getDoc(doc(db, 'approvedUsers', emailDocId(email)));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Every approvedUsers doc — the Approvals admin tab's source list. */
export async function loadApprovedUsers() {
  const snap = await getDocs(collection(db, 'approvedUsers'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Create or update an approvedUsers doc (grants roster/mentorship access). */
export async function upsertApprovedUser(email, role) {
  const lower = (email || '').toLowerCase().trim();
  await setDoc(doc(db, 'approvedUsers', emailDocId(lower)), { email: lower, role }, { merge: true });
}

/**
 * Revokes an approvedUsers doc and cascades: any elevated-role docs for the
 * same email are removed in the same batch, so revoking someone doesn't
 * leave them as an orphaned admin/family-head/eboard-member/DEI-editor with
 * no roster access to have earned it through.
 */
export async function revokeApprovedUser(email) {
  const id = emailDocId(email);
  const batch = writeBatch(db);
  batch.delete(doc(db, 'approvedUsers', id));
  batch.delete(doc(db, 'admins', id));
  batch.delete(doc(db, 'familyHeads', id));
  batch.delete(doc(db, 'eboardMembers', id));
  batch.delete(doc(db, 'deiEditors', id));
  await batch.commit();
}

/** Is this email an admin (the authoritative admins collection, not approvedUsers.role)? */
export async function checkIsAdmin(email) {
  const snap = await getDoc(doc(db, 'admins', emailDocId(email)));
  return snap.exists();
}

const ROLE_COLLECTIONS = ['admins', 'familyHeads', 'eboardMembers', 'deiEditors'];

/**
 * Every doc across the four elevated-role collections, merged by email doc
 * id, for the Roles admin tab's table: { [docId]: { admins, familyHeads,
 * eboardMembers, deiEditors } } — each value is the doc data or null.
 */
export async function loadRoleCollections() {
  const snaps = await Promise.all(ROLE_COLLECTIONS.map((name) => getDocs(collection(db, name))));
  const byId = {};
  snaps.forEach((snap, i) => {
    const name = ROLE_COLLECTIONS[i];
    snap.docs.forEach((d) => {
      byId[d.id] = byId[d.id] || {};
      byId[d.id][name] = { id: d.id, ...d.data() };
    });
  });
  return byId;
}

export async function setAdmin(email, on) {
  const ref = doc(db, 'admins', emailDocId(email));
  if (on) await setDoc(ref, { email: (email || '').toLowerCase().trim() });
  else await deleteDoc(ref);
}

export async function setFamilyHead(email, on) {
  const ref = doc(db, 'familyHeads', emailDocId(email));
  if (on) await setDoc(ref, { email: (email || '').toLowerCase().trim() });
  else await deleteDoc(ref);
}

export async function setEboardMember(email, { active }) {
  const ref = doc(db, 'eboardMembers', emailDocId(email));
  if (active) await setDoc(ref, { email: (email || '').toLowerCase().trim(), active: true }, { merge: true });
  else await deleteDoc(ref);
}

export async function setDeiEditor(email, { active, categories }) {
  const ref = doc(db, 'deiEditors', emailDocId(email));
  if (active) {
    await setDoc(
      ref,
      { email: (email || '').toLowerCase().trim(), active: true, categories: categories || {} },
      { merge: true },
    );
  } else {
    await deleteDoc(ref);
  }
}

/** kind: 'alumni' | 'brothers' — the Firestore-backed directory profiles Slice 1 reads. */
export async function createDirectoryProfile(kind, data) {
  await addDoc(collection(db, kind), data);
}

export async function updateDirectoryProfile(kind, id, data) {
  await setDoc(doc(db, kind, id), data, { merge: true });
}

export async function deleteDirectoryProfile(kind, id) {
  await deleteDoc(doc(db, kind, id));
}

/**
 * type: 'mentor' (a brother requesting a mentor) or 'mentee' (an alumnus
 * offering to mentor) — matches the portal's own mentorRequests.type values
 * and its canRequestMentorshipType(brother->mentor, alumni->mentee) rule.
 */
export async function submitMentorshipRequest({ type, targetName, targetEmail, requester }) {
  await addDoc(collection(db, 'mentorRequests'), {
    type,
    name: targetName || '',
    email: (targetEmail || '').toLowerCase(),
    requestedByName: requester && requester.name ? requester.name : '',
    requestedByEmail: requester && requester.email ? requester.email : '',
    createdAt: new Date().toISOString(),
    status: 'pending',
  });
}

/** This user's own outstanding mentor/mentee requests, so a row can show
 * "Request pending" instead of re-offering the button forever. */
export async function loadMyRequests(email) {
  const snap = await getDocs(
    query(collection(db, 'mentorRequests'), where('requestedByEmail', '==', (email || '').toLowerCase())),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * This user's active pairing, or null if unpaired. Checks both directions:
 * as the alumni mentor (alumniEmail), or as a paired brother — the portal's
 * pairing docs only store mentees in a nested `brothers[]` array today,
 * which Firestore can't query by field, so the mentee side also checks a
 * flat `menteeEmails` array that doesn't exist in the data yet (Slice 1b's
 * pairing-creation work needs to start writing it). Until then this only
 * ever resolves for the alumni side — expected, not a bug.
 */
export async function loadMyPairing(email) {
  const lower = (email || '').toLowerCase();
  const [asMentor, asMentee] = await Promise.all([
    getDocs(query(collection(db, 'mentorshipPairings'), where('alumniEmail', '==', lower))),
    getDocs(query(collection(db, 'mentorshipPairings'), where('menteeEmails', 'array-contains', lower))),
  ]);
  const match = asMentor.docs[0] || asMentee.docs[0];
  return match ? { id: match.id, ...match.data() } : null;
}
