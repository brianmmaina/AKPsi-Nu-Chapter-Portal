import { app } from "./firebase-config.js";


import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  collection,
  collectionGroup,
  addDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  browserSessionPersistence,
  setPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const auth = getAuth(app);
setPersistence(auth, browserSessionPersistence).catch(e => console.error("Persistence error:", e));
const db = getFirestore(app);
const storage = getStorage(app);
const provider = new GoogleAuthProvider();

window.handleSignOut = async function() {
  await auth.signOut();
  window.location.reload();
};

window.confirmSignOut = function() {
  if (confirm("Are you sure you want to sign out?")) {
    window.handleSignOut();
  }
};

function setLoginOverlayVisible(isVisible) {
  document.body.classList.toggle("portal-locked", Boolean(isVisible));

  const loginOverlay = document.getElementById("loginOverlay");
  if (loginOverlay) loginOverlay.style.display = isVisible ? "flex" : "none";
}

function markPortalBooted() {
  document.body.classList.remove("portal-booting");
  if (typeof applyStoredTheme === "function") applyStoredTheme();
}

function safeEmailKey(email) {
  return String(email || "").replace(/\./g, "_");
}

function esc(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatTimestamp(value) {
  if (!value) return "No timestamp";

  if (typeof value.toDate === "function") {
    return value.toDate().toLocaleString();
  }

  return String(value);
}


// ─── ADMIN ACCESS CHECK ────────────────────────────────────────────────────────
async function checkAdminAccess(user) {
  if (!user) return false;

  const safeEmail = safeEmailKey(user.email);
  

  try {
    const adminRef = doc(db, "admins", safeEmail);
    const adminSnap = await getDoc(adminRef);
    return adminSnap.exists();
  } catch (error) {
    console.error("Admin check failed:", error);
    return false;
  }
}

async function checkFamilyHeadAccess(user) {
  if (!user) return false;

  const safeEmail = safeEmailKey(user.email);

  try {
    const familyHeadSnap = await getDoc(doc(db, "familyHeads", safeEmail));
    return familyHeadSnap.exists();
  } catch (error) {
    console.error("Family Head check failed:", error);
    return false;
  }
}

async function loadCurrentDEIAccess(user) {
  if (!user) return { canPost: false, categories: [] };

  const safeEmail = safeEmailKey(user.email);

  try {
    const deiSnap = await getDoc(doc(db, "deiEditors", safeEmail));
    if (!deiSnap.exists()) return { canPost: false, categories: [] };

    const data = deiSnap.data();
    const categories = Object.entries(data.categories || {})
      .filter(([, enabled]) => Boolean(enabled))
      .map(([category]) => category);

    return {
      canPost: Boolean(data.active !== false && categories.length),
      categories
    };
  } catch (error) {
    console.error("DEI access check failed:", error);
    return { canPost: false, categories: [] };
  }
}

async function loadCurrentUserAccess(user) {
  if (!user) {
    return {
      role: "",
      linkedProfileEmail: "",
      linkedProfileName: ""
    };
  }

  const safeEmail = safeEmailKey(user.email);

  try {
    const userSnap = await getDoc(doc(db, "approvedUsers", safeEmail));
    const data = userSnap.exists() ? userSnap.data() : {};
    const role = String(data.role || "").toLowerCase().trim();

    return {
      role: ["brother", "alumni"].includes(role) ? role : "",
      linkedProfileEmail: String(data.linkedProfileEmail || data.email || user.email || "").toLowerCase().trim(),
      linkedProfileName: data.linkedProfileName || data.name || ""
    };
  } catch (error) {
    console.error("User access load failed:", error);
    return {
      role: "",
      linkedProfileEmail: String(user.email || "").toLowerCase().trim(),
      linkedProfileName: ""
    };
  }
}

async function loadCurrentUserRole(user) {
  const access = await loadCurrentUserAccess(user);
  return access.role;
}

function setPortalAccessState({
  user,
  role = "",
  isAdmin = false,
  isFamilyHead = false,
  deiAccess = {},
  linkedProfileEmail = "",
  linkedProfileName = ""
}) {
  window.currentPortalUser = user || null;
  window.currentUserRole = role;
  window.currentUserIsAdmin = Boolean(isAdmin);
  window.currentUserIsFamilyHead = Boolean(isFamilyHead);
  window.currentLinkedProfileEmail = user
    ? String(linkedProfileEmail || user.email || "").toLowerCase().trim()
    : "";
  window.currentLinkedProfileName = linkedProfileName || "";
  window.currentUserDEIAccess = {
    canPost: Boolean(deiAccess.canPost || isAdmin),
    categories: Array.isArray(deiAccess.categories) ? deiAccess.categories : []
  };

  const familyPostBtn = document.getElementById("familyPostBtn");
  if (familyPostBtn) {
    familyPostBtn.style.display = isFamilyHead || isAdmin ? "inline-flex" : "none";
  }

  const signOutBtn = document.getElementById("signOutBtn");
  if (signOutBtn) {
    signOutBtn.style.display = user ? "inline-flex" : "none";
  }

  const portalGuideBtn = document.getElementById("portalGuideBtn");
  if (portalGuideBtn) {
    portalGuideBtn.style.display = user ? "inline-flex" : "none";
  }

  const feedbackBtn = document.getElementById("deiFeedbackNavBtn");
  if (feedbackBtn) {
    feedbackBtn.style.display = role === "brother" || isAdmin ? "block" : "none";
  }

  const deiPostBtn = document.getElementById("deiPostBtn");
  if (deiPostBtn) {
    deiPostBtn.style.display = window.currentUserDEIAccess.canPost ? "inline-flex" : "none";
  }

  window.dispatchEvent(new CustomEvent("portalAccessChanged", {
    detail: {
      email: user?.email || "",
      role,
      isAdmin,
      isFamilyHead,
      linkedProfileEmail: window.currentLinkedProfileEmail,
      linkedProfileName: window.currentLinkedProfileName,
      deiAccess: window.currentUserDEIAccess
    }
  }));
}

async function hydratePortalAccess(user) {
  if (!user) {
    setPortalAccessState({ user: null });
    return { role: "", isAdmin: false, isFamilyHead: false, deiAccess: { canPost: false, categories: [] } };
  }

  const [userAccess, isAdmin, isFamilyHead, deiAccess] = await Promise.all([
    loadCurrentUserAccess(user),
    checkAdminAccess(user),
    checkFamilyHeadAccess(user),
    loadCurrentDEIAccess(user)
  ]);

  setPortalAccessState({
    user,
    role: userAccess.role,
    isAdmin,
    isFamilyHead,
    deiAccess,
    linkedProfileEmail: userAccess.linkedProfileEmail,
    linkedProfileName: userAccess.linkedProfileName
  });

  return {
    role: userAccess.role,
    isAdmin,
    isFamilyHead,
    deiAccess,
    linkedProfileEmail: userAccess.linkedProfileEmail,
    linkedProfileName: userAccess.linkedProfileName
  };
}

window.checkFamilyHeadAccess = checkFamilyHeadAccess;
window.loadCurrentUserRole = loadCurrentUserRole;
window.loadCurrentDEIAccess = loadCurrentDEIAccess;

function isOwnAlumniProfile(profile) {
  return [
    window.currentPortalUser?.email,
    window.currentLinkedProfileEmail
  ].some((email) => emailMatchesProfile(profile, email));
}

window.isOwnAlumniProfile = isOwnAlumniProfile;

window.canRequestMentorshipType = function (type) {
  const role = String(window.currentUserRole || "").toLowerCase();
  const normalizedType = String(type || "").toLowerCase();

  if (window.currentUserIsAdmin) return true;
  if (normalizedType === "mentor") return role === "brother";
  if (normalizedType === "mentee") return role === "alumni";
  return false;
};


// ─── ADMIN FIREBASE HELPERS ────────────────────────────────────────────────────
window.loadAdminMentorRequests = async function () {
  try {
    const requestsSnap = await getDocs(collection(db, "mentorRequests"));
    const requests = [];

    requestsSnap.forEach((docSnap) => {
      const request = docSnap.data();
      const type = String(request.type || "").toLowerCase();

      if (type === "mentor" || type === "mentor-request") {
        requests.push({
          id: docSnap.id,
          ...request
        });
      }
    });

    return requests;
  } catch (error) {
    console.error("Failed to load mentor requests:", error);
    return [];
  }
};

window.loadAdminMenteeRequests = async function () {
  try {
    const requestsSnap = await getDocs(collection(db, "mentorRequests"));
    const requests = [];

    requestsSnap.forEach((docSnap) => {
      const request = docSnap.data();
      const type = String(request.type || "").toLowerCase();

      if (type === "mentee") {
        requests.push({
          id: docSnap.id,
          ...request
        });
      }
    });

    return requests;
  } catch (error) {
    console.error("Failed to load mentee requests:", error);
    return [];
  }
};

window.loadAdminNotesForAdmin = async function () {
  try {
    const notesSnap = await getDocs(collectionGroup(db, "mentorshipNotes"));

    return notesSnap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
  } catch (error) {
    console.error("Failed to load admin notes:", error);
    return [];
  }
};

window.renderRequestCard = function (request, fallbackTitle) {
  return `
    <div class="mentor-alert mentor-request-admin-card" style="margin-bottom:12px;">
      <h3>${esc(request.mentorName || fallbackTitle || "Request")}</h3>
      <p><strong>Submitted by:</strong> ${esc(request.brotherEmail || request.userEmail || "N/A")}</p>
      <p><strong>Type:</strong> ${esc(request.type || "N/A")}</p>
      <p><strong>Status:</strong> ${esc(request.status || "pending")}</p>
      <p><strong>Created:</strong> ${esc(formatTimestamp(request.createdAt))}</p>
      <p><strong>Next step:</strong> Create or update the confirmed relationship in Mentorship Pairings.</p>
      <div class="admin-card-actions">
        <button type="button" onclick='deleteMentorshipRequestFromAdmin(${JSON.stringify(request.id)})'>
          Delete Request
        </button>
      </div>
    </div>
  `;
};

window.deleteMentorshipRequest = async function (requestId) {
  if (!(await requireLiveAdminAccess("delete mentorship requests"))) return false;

  if (!requestId) {
    alert("This request is missing an ID.");
    return false;
  }

  try {
    await deleteDoc(doc(db, "mentorRequests", requestId));
    return true;
  } catch (error) {
    console.error("Failed to delete mentorship request:", error);
    alert("Could not delete this mentorship request.");
    return false;
  }
};

window.loadMentorshipPairings = async function () {
  try {
    const pairingsSnap = await getDocs(collection(db, "mentorshipPairings"));

    return pairingsSnap.docs
      .map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }))
      .sort((a, b) => {
        const aTime = typeof a.updatedAt?.toMillis === "function" ? a.updatedAt.toMillis() : 0;
        const bTime = typeof b.updatedAt?.toMillis === "function" ? b.updatedAt.toMillis() : 0;
        return bTime - aTime;
      });
  } catch (error) {
    console.error("Failed to load mentorship pairings:", error);
    return [];
  }
};

window.saveMentorshipPairing = async function (pairing) {
  try {
    if (!(await requireLiveAdminAccess("save mentorship pairings"))) return null;

    const alumniEmail = String(pairing.alumniEmail || "").toLowerCase().trim();
    const brothers = Array.isArray(pairing.brothers)
      ? pairing.brothers
          .filter((brother) => brother?.email || brother?.name)
          .slice(0, 2)
          .map((brother) => ({
            name: brother.name || "",
            email: String(brother.email || "").toLowerCase().trim(),
            completedCheckIns: Math.max(0, Number(brother.completedCheckIns || 0)),
            totalCheckIns: Math.max(1, Number(brother.totalCheckIns || pairing.totalCheckIns || 3)),
            progressNote: brother.progressNote || ""
          }))
      : [];

    if (!alumniEmail || !brothers.length) {
      alert("Choose one alumni mentor and at least one brother.");
      return null;
    }

    const pairingId = pairing.id || `${safeEmailKey(alumniEmail)}-${Date.now()}`;

    await setDoc(doc(db, "mentorshipPairings", pairingId), {
      alumniName: pairing.alumniName || "",
      alumniEmail,
      alumniCompany: pairing.alumniCompany || "",
      alumniRole: pairing.alumniRole || "",
      brothers,
      status: pairing.status || "active",
      createdBy: auth.currentUser?.email || "",
      updatedAt: serverTimestamp(),
      ...(pairing.id ? {} : { createdAt: serverTimestamp() })
    }, { merge: true });

    return pairingId;
  } catch (error) {
    console.error("Failed to save mentorship pairing:", error);
    alert("Could not save mentorship pairing.");
    return null;
  }
};

window.deleteMentorshipPairing = async function (pairingId) {
  try {
    if (!(await requireLiveAdminAccess("delete mentorship pairings"))) return false;

    await deleteDoc(doc(db, "mentorshipPairings", pairingId));
    return true;
  } catch (error) {
    console.error("Failed to delete mentorship pairing:", error);
    alert("Could not delete mentorship pairing.");
    return false;
  }
};

window.loadMyMentorshipWorkspace = async function() {
  const content = document.getElementById("myMentorshipContent");
  if (!content) return;

  content.innerHTML = `<div class="mentor-alert">Loading your mentorship data...</div>`;

  const pairings = await window.loadMyMentorshipPairings();

  if (!pairings.length) {
    content.innerHTML = `<div class="mentor-alert">You don't have an active mentorship pairing yet. Check back after VPAR confirms your match.</div>`;
    return;
  }

  const pairing = pairings[0];
  const currentEmail = String(window.currentPortalUser?.email || "").toLowerCase().trim();
  const linkedEmail = String(window.currentLinkedProfileEmail || "").toLowerCase().trim();
  const emailSet = new Set([currentEmail, linkedEmail].filter(Boolean));
  const isAlumni = emailSet.has(String(pairing.alumniEmail || "").toLowerCase().trim());
  const brothers = Array.isArray(pairing.brothers) ? pairing.brothers : [];
  const myBrother = brothers.find(b => emailSet.has(String(b.email || "").toLowerCase().trim()));

  const partnerName = isAlumni
    ? brothers.map(b => b.name).join(" & ") || "Your mentee"
    : pairing.alumniName || "Your mentor";

  const partnerRole = isAlumni
    ? brothers.map(b => b.email).join(", ")
    : `${pairing.alumniRole || ""} · ${pairing.alumniCompany || ""}`;

  const brother = myBrother || brothers[0];
  const totalCheckIns = Math.max(1, Number(brother?.totalCheckIns || 3));
  const completedCheckIns = Math.min(totalCheckIns, Math.max(0, Number(brother?.completedCheckIns || 0)));
  const percent = Math.round((completedCheckIns / totalCheckIns) * 100);

  const notes = await window.loadSharedMentorshipNotes(pairing.id);

  content.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:24px;">
      <div class="mentor-alert">
        <div class="dashboard-eyebrow" style="margin-bottom:8px;">${isAlumni ? "Your Mentee" : "Your Mentor"}</div>
        <h3 style="margin:0 0 6px;">${esc(partnerName)}</h3>
        <div style="color:var(--muted);font-size:13px;">${esc(partnerRole)}</div>
        <div class="dashboard-pill-row" style="margin-top:12px;">
          <span class="dashboard-pill">Active Pairing</span>
        </div>
      </div>

      <div class="mentor-alert">
        <div class="dashboard-eyebrow" style="margin-bottom:8px;">Check-in Progress</div>
        <div class="mentor-progress-row">
          <strong>${completedCheckIns} of ${totalCheckIns} check-ins</strong>
          <span>${percent}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${percent}%;"></div>
        </div>
        <div style="color:var(--muted);font-size:13px;margin-top:8px;">${esc(brother?.progressNote || "No check-ins approved yet.")}</div>
        ${!isAlumni ? `
          <button class="gold" type="button" style="margin-top:14px;border-radius:12px;width:100%;" onclick="submitPairingCheckInFromDashboard('${esc(pairing.id)}', '${esc(brother?.email || currentEmail)}', '${esc(brother?.name || "")}')">
            Submit Meeting Completed
          </button>
        ` : ""}
      </div>
    </div>

    <div class="mentor-alert" style="margin-bottom:0;">
      <div class="dashboard-eyebrow" style="margin-bottom:12px;">Shared Notes</div>
      <div class="live-tag" style="margin-bottom:14px;">SHARED WITH YOUR ${isAlumni ? "MENTEE" : "MENTOR"}</div>

      <ul id="sharedNotesList" style="list-style:none;padding:0;margin:0 0 14px;">
        ${notes.length ? notes.map(note => `
          <li class="note-item" data-note-id="${esc(note.id)}">
            <span>${esc(note.note)}</span>
            <span style="color:var(--muted);font-size:11px;margin-left:8px;">${esc(note.authorName || String(note.authorEmail || "").split("@")[0] || "")}</span>
            ${emailSet.has(String(note.authorEmail || "").toLowerCase().trim()) ? `
              <button type="button" class="delete-note-btn" onclick="deleteSharedMentorshipNote('${esc(pairing.id)}', '${esc(note.id)}')">Delete</button>
            ` : ""}
          </li>
        `).join("") : `<li style="color:var(--muted);font-size:13px;">No shared notes yet. Add the first one!</li>`}
      </ul>

      <div class="note-input-wrap">
        <input id="sharedNoteInput" class="note-input" type="text" placeholder="Add a shared note...">
        <button type="button" class="add-note-btn" onclick="addSharedMentorshipNote('${esc(pairing.id)}')">Add</button>
      </div>
    </div>
  `;
};

window.loadSharedMentorshipNotes = async function(pairingId) {
  try {
    const notesSnap = await getDocs(
      collection(db, "mentorshipPairings", pairingId, "sharedNotes")
    );
    return notesSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return aTime - bTime;
      });
  } catch (error) {
    console.error("Failed to load shared notes:", error);
    return [];
  }
};

window.addSharedMentorshipNote = async function(pairingId) {
  const user = auth.currentUser;
  if (!user) return;

  const input = document.getElementById("sharedNoteInput");
  const noteText = input?.value.trim();
  if (!noteText) return;

  try {
    const authorName = user.displayName || 
    String(user.email || "").split("@")[0] || "";

  await addDoc(collection(db, "mentorshipPairings", pairingId, "sharedNotes"), {
      note: noteText,
      authorEmail: user.email,
      authorName,
      createdAt: serverTimestamp()
    });

    if (input) input.value = "";
    await window.loadMyMentorshipWorkspace();
  } catch (error) {
    console.error("Failed to add shared note:", error);
    toast("Could not add note.");
  }
};

window.deleteSharedMentorshipNote = async function(pairingId, noteId) {
  try {
    await deleteDoc(doc(db, "mentorshipPairings", pairingId, "sharedNotes", noteId));
    await window.loadMyMentorshipWorkspace();
  } catch (error) {
    console.error("Failed to delete shared note:", error);
    toast("Could not delete note.");
  }
};

window.loadMyMentorshipPairings = async function () {
  const user = auth.currentUser;
  if (!user) return [];

  const emailSet = new Set([
    user.email,
    window.currentLinkedProfileEmail
  ]
    .map((email) => String(email || "").toLowerCase().trim())
    .filter(Boolean));
  const pairings = await window.loadMentorshipPairings();

  return pairings.filter((pairing) => {
    const alumniEmail = String(pairing.alumniEmail || "").toLowerCase().trim();
    const brothers = Array.isArray(pairing.brothers) ? pairing.brothers : [];
    return emailSet.has(alumniEmail) || brothers.some((brother) => emailSet.has(String(brother.email || "").toLowerCase().trim()));
  });
};

window.submitMentorshipCheckInRequest = async function (pairingId, brotherEmail, brotherName = "") {
  const user = auth.currentUser;

  if (!user) {
    alert("Please sign in first.");
    return false;
  }

  try {
    const pairingSnap = await getDoc(doc(db, "mentorshipPairings", pairingId));

    if (!pairingSnap.exists()) {
      alert("This pairing no longer exists.");
      return false;
    }

    const pairing = pairingSnap.data();
    const requesterEmail = String(user.email || "").toLowerCase().trim();
    const requesterEmails = new Set([
      requesterEmail,
      window.currentLinkedProfileEmail
    ]
      .map((email) => String(email || "").toLowerCase().trim())
      .filter(Boolean));
    const normalizedBrotherEmail = String(brotherEmail || "").toLowerCase().trim();
    const alumniEmail = String(pairing.alumniEmail || "").toLowerCase().trim();
    const brotherAllowed = (pairing.brothers || []).some((brother) =>
      String(brother.email || "").toLowerCase().trim() === normalizedBrotherEmail
    );

    if (!requesterEmails.has(alumniEmail) && !requesterEmails.has(normalizedBrotherEmail)) {
      alert("Only someone in this pairing can submit a check-in completion request.");
      return false;
    }

    if (!brotherAllowed) {
      alert("Choose a brother from this pairing.");
      return false;
    }

    const requestId = `${pairingId}-${safeEmailKey(normalizedBrotherEmail)}-${Date.now()}`;

    await setDoc(doc(db, "mentorshipCheckInRequests", requestId), {
      pairingId,
      alumniName: pairing.alumniName || "",
      alumniEmail,
      brotherName,
      brotherEmail: normalizedBrotherEmail,
      requesterEmail: user.email || "",
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error("Failed to submit check-in request:", error);
    alert("Could not submit this check-in request.");
    return false;
  }
};

window.loadMentorshipCheckInRequests = async function () {
  try {
    const requestsSnap = await getDocs(collection(db, "mentorshipCheckInRequests"));

    return requestsSnap.docs
      .map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }))
      .sort((a, b) => {
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (a.status !== "pending" && b.status === "pending") return 1;
        const aTime = typeof a.createdAt?.toMillis === "function" ? a.createdAt.toMillis() : 0;
        const bTime = typeof b.createdAt?.toMillis === "function" ? b.createdAt.toMillis() : 0;
        return bTime - aTime;
      });
  } catch (error) {
    console.error("Failed to load mentorship check-in requests:", error);
    return [];
  }
};

window.reviewMentorshipCheckInRequest = async function (requestId, approved) {
  try {
    if (!(await requireLiveAdminAccess("review mentorship check-ins"))) return false;

    const requestRef = doc(db, "mentorshipCheckInRequests", requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) {
      alert("This check-in request no longer exists.");
      return false;
    }

    const request = requestSnap.data();

    if (approved) {
      const pairingRef = doc(db, "mentorshipPairings", request.pairingId);
      const pairingSnap = await getDoc(pairingRef);

      if (!pairingSnap.exists()) {
        alert("The related pairing no longer exists.");
        return false;
      }

      const pairing = pairingSnap.data();
      const brotherEmail = String(request.brotherEmail || "").toLowerCase().trim();
      const brothers = (pairing.brothers || []).map((brother) => {
        const email = String(brother.email || "").toLowerCase().trim();
        if (email !== brotherEmail) return brother;

        const totalCheckIns = Math.max(1, Number(brother.totalCheckIns || 3));
        const completedCheckIns = Math.min(totalCheckIns, Math.max(0, Number(brother.completedCheckIns || 0)) + 1);

        return {
          ...brother,
          completedCheckIns,
          totalCheckIns,
          progressNote: `Latest check-in approved ${new Date().toLocaleDateString()}`
        };
      });

      await setDoc(pairingRef, {
        brothers,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }

    await setDoc(requestRef, {
      status: approved ? "approved" : "rejected",
      reviewedBy: auth.currentUser?.email || "",
      reviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    return true;
  } catch (error) {
    console.error("Failed to review check-in request:", error);
    alert("Could not review this check-in request.");
    return false;
  }
};

window.renderAdminNoteCard = function (note) {
  return `
    <div class="mentor-alert" style="margin-bottom:12px;">
      <h3>Mentorship Note</h3>
      <p>${esc(note.note || "No note text")}</p>
      <p><strong>User:</strong> ${esc(note.userEmail || "N/A")}</p>
      <p><strong>Created:</strong> ${esc(formatTimestamp(note.createdAt))}</p>
    </div>
  `;
};


// ─── MENTOR / MENTEE REQUEST ──────────────────────────────────────────────────
let alumniEditTargetId = null;
let alumniEditTargetProfile = null;
let alumniEditPhotoFile = null;

window.openAlumniEditModal = function(firebaseId, profile) {
  alumniEditTargetId = firebaseId;
  alumniEditTargetProfile = profile;
  alumniEditPhotoFile = null;

  const companyInput = document.getElementById("alumniEditCompany");
  const roleInput = document.getElementById("alumniEditRole");
  const locationInput = document.getElementById("alumniEditLocation");
  const linkedinInput = document.getElementById("alumniEditLinkedin");
  const preview = document.getElementById("alumniEditPhotoPreview");
  const removeBtn = document.getElementById("alumniEditRemovePhotoBtn");

  if (companyInput) companyInput.value = profile.company || "";
  if (roleInput) roleInput.value = profile.role || "";
  if (locationInput) locationInput.value = profile.location || "";
  if (linkedinInput) linkedinInput.value = profile.linkedin || "";
  const pledgeInput = document.getElementById("alumniEditPledgeClass");
if (pledgeInput) pledgeInput.value = profile.pledgeClass || "";
const gradYearInput = document.getElementById("alumniEditGradYear");
if (gradYearInput) gradYearInput.value = profile.gradYear || "";

  if (preview) {
    const existingPhoto = profile.profileImageUrl || profile.profilePhotoUrl || "";
    if (existingPhoto) {
      preview.innerHTML = `<img src="${existingPhoto}" alt="Current profile photo" style="width:82px;height:82px;object-fit:cover;border-radius:50%;border:1px solid rgba(224,189,100,.32);">`;
    } else {
      preview.innerHTML = "No photo selected.";
    }
  }

  if (removeBtn) removeBtn.style.display = "none";

  const modal = document.getElementById("alumniEditModal");
  if (modal) modal.style.display = "flex";
};

window.closeAlumniEditModal = function() {
  alumniEditTargetId = null;
  alumniEditTargetProfile = null;
  alumniEditPhotoFile = null;

  const modal = document.getElementById("alumniEditModal");
  if (modal) modal.style.display = "none";
};

window.handleAlumniEditPhoto = function(input) {
  const file = Array.from(input?.files || []).find(f => f.type.startsWith("image/"));
  if (!file) return;

  if (file.size > 20 * 1024 * 1024) {
    alert("Photo must be under 20MB.");
    input.value = "";
    return;
  }

  alumniEditPhotoFile = file;

  const preview = document.getElementById("alumniEditPhotoPreview");
  const removeBtn = document.getElementById("alumniEditRemovePhotoBtn");

  if (preview) {
    preview.innerHTML = `<img src="${URL.createObjectURL(file)}" alt="New profile photo preview" style="width:82px;height:82px;object-fit:cover;border-radius:50%;border:1px solid rgba(224,189,100,.32);">`;
  }

  if (removeBtn) removeBtn.style.display = "inline-flex";
};

window.removeAlumniEditPhoto = function() {
  alumniEditPhotoFile = null;

  const input = document.getElementById("alumniEditPhoto");
  const preview = document.getElementById("alumniEditPhotoPreview");
  const removeBtn = document.getElementById("alumniEditRemovePhotoBtn");

  if (input) input.value = "";
  if (preview) preview.innerHTML = "No photo selected.";
  if (removeBtn) removeBtn.style.display = "none";
};

window.submitAlumniEditRequest = async function() {
  const user = auth.currentUser;
  if (!user) {
    alert("Please sign in first.");
    return;
  }

  if (!alumniEditTargetProfile) {
    alert("No profile selected.");
    return;
  }

  const companyInput = document.getElementById("alumniEditCompany");
  const roleInput = document.getElementById("alumniEditRole");
  const locationInput = document.getElementById("alumniEditLocation");
  const linkedinInput = document.getElementById("alumniEditLinkedin");

  const changes = {};
  const company = companyInput?.value.trim() || "";
  const role = roleInput?.value.trim() || "";
  const location = locationInput?.value.trim() || "";
  const linkedin = linkedinInput?.value.trim() || "";

  if (company !== (alumniEditTargetProfile.company || "")) changes.company = company;
  if (role !== (alumniEditTargetProfile.role || "")) changes.role = role;
  if (location !== (alumniEditTargetProfile.location || "")) changes.location = location;
  if (linkedin !== (alumniEditTargetProfile.linkedin || "")) changes.linkedin = linkedin;
  
  const gradYear = document.getElementById("alumniEditGradYear")?.value.trim() || "";
if (gradYear !== (alumniEditTargetProfile.gradYear || "")) changes.gradYear = gradYear;

  if (!Object.keys(changes).length && !alumniEditPhotoFile) {
    alert("No changes detected.");
    return;
  }

  try {
    const requestId = `profile-edit-${safeEmailKey(user.email)}-${Date.now()}`;
    let newImageUrl = "";
    let newImagePath = "";

    if (alumniEditPhotoFile) {
      const uploaded = await window.uploadProfileImage(
        alumniEditPhotoFile,
        "pending-alumni",
        requestId
      );

      if (!uploaded) return;

      newImageUrl = uploaded.url;
      newImagePath = uploaded.path;
    }

    await setDoc(doc(db, "profileEditRequests", requestId), {
      profileType: "alumni",
      profileId: alumniEditTargetId || directoryKey(alumniEditTargetProfile),
      profileEmail: String(alumniEditTargetProfile.email || "").toLowerCase().trim(),
      profileName: alumniEditTargetProfile.name || "",
      submittedBy: user.email,
      changes,
      newImageUrl,
      newImagePath,
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });


    sendVPARNotification(
      "New Profile Edit Request — Nu Chapter Portal",
      `${alumniEditTargetProfile.name || "An alumni"} submitted a profile edit request.\n\nChanges: ${JSON.stringify(changes, null, 2)}\n\nReview at: https://nu-chapter-connect-portal.web.app`
    );

    window.closeAlumniEditModal();
    toast("Profile edit submitted. VPAR will review it shortly.");
  } catch (error) {
    console.error("Failed to submit profile edit request:", error);
    alert("Could not submit your profile edit. Please try again.");
  }
};

async function sendVPARNotification(subject, message) {
  try {
    await emailjs.send("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", {
      to_email: "YOUR_EMAIL_HERE",
      subject: subject,
      message: message,
      from_name: "Nu Chapter Portal"
    });
    
  } catch (error) {
    console.warn("Could not send VPAR notification:", error);
  }
}

window.saveMentorRequest = async function (type, name) {
  const user = auth.currentUser;

  if (!user) {
    alert("Please sign in first.");
    return;
  }

  if (!window.canRequestMentorshipType(type)) {
    const role = window.currentUserRole || "unassigned";
    const message = type === "mentor"
      ? "Only active brothers can choose alumni mentors."
      : "Only alumni can choose active brother mentees.";
    alert(`${message} Your current portal role is: ${role}.`);
    return;
  }

  try {
    await addDoc(collection(db, "mentorRequests"), {
      brotherEmail: user.email,
      brotherUid: user.uid,
      mentorName: name,
      type: type,
      status: "pending",
      visibleToMentor: false,
      totalCheckIns: 3,
      completedCheckIns: 0,
      progressNote: "",
      createdAt: serverTimestamp()
    });

    
    sendVPARNotification(
      `New Mentorship Request — ${type === "mentor" ? "Brother chose mentor" : "Alumni chose mentee"}`,
      `A ${type === "mentor" ? "brother" : "alumni"} requested ${name} as their ${type}.\n\nReview at: https://nu-chapter-connect-portal.web.app`
    );
  } catch (error) {
    console.error("Failed to save mentorship request:", error);
  }
};


// ─── MENTORSHIP NOTES ─────────────────────────────────────────────────────────
window.deleteMentorshipNote = async function (noteId) {
  const user = auth.currentUser;
  if (!user) return;

  const safeEmail = safeEmailKey(user.email);

  try {
    await deleteDoc(doc(db, "users", safeEmail, "mentorshipNotes", noteId));
    
  } catch (error) {
    console.error("Failed to delete note:", error);
  }
};

window.loadMentorshipNotes = async function () {
  const user = auth.currentUser;
  if (!user) return [];

  const safeEmail = safeEmailKey(user.email);

  try {
    const notesSnap = await getDocs(
      collection(db, "users", safeEmail, "mentorshipNotes")
    );

    return notesSnap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
  } catch (error) {
    console.error("Failed to load notes:", error);
    return [];
  }
};

window.saveMentorshipNote = async function (noteText) {
  const user = auth.currentUser;

  if (!user) {
    alert("Please sign in first.");
    return;
  }

  const safeEmail = safeEmailKey(user.email);

  try {
    const docRef = await addDoc(
      collection(db, "users", safeEmail, "mentorshipNotes"),
      {
        note: noteText,
        userEmail: user.email,
        createdAt: serverTimestamp()
      }
    );

    
    return docRef.id;
  } catch (error) {
    console.error("Failed to save note:", error);
  }
};


// ─── REQUEST MENTOR LEGACY HELPER ──────────────────────────────────────────────
window.requestMentor = async function (mentor) {
  const user = auth.currentUser;

  if (!user) {
    alert("Please sign in first.");
    return;
  }

  try {
    const mentorData =
      typeof mentor === "string"
        ? { name: mentor }
        : mentor;

    if (!window.canRequestMentorshipType("mentor")) {
      alert("Only active brothers can choose alumni mentors.");
      return;
    }

    await addDoc(collection(db, "mentorRequests"), {
      brotherEmail: user.email,
      brotherUid: user.uid,
      mentorName: mentorData.name || "Unknown Mentor",
      mentorCompany: mentorData.company || "N/A",
      mentorRole: mentorData.role || "N/A",
      mentorField: mentorData.field || "N/A",
      type: "mentor",
      status: "pending",
      visibleToMentor: false,
      totalCheckIns: 3,
      completedCheckIns: 0,
      progressNote: "",
      createdAt: serverTimestamp()
    });

    alert(`${mentorData.name || "Mentor"} has been requested as a mentor.`);
  } catch (error) {
    console.error("MENTOR REQUEST ERROR:", error);
    alert(error.code + " - " + error.message);
  }
};

window.loadHomepageSettings = async function () {
  try {
    const settingsRef = doc(db, "siteSettings", "homepage");
    const settingsSnap = await getDoc(settingsRef);

    if (!settingsSnap.exists()) return null;

    return settingsSnap.data();
  } catch (error) {
    console.error("Failed to load homepage settings:", error);
    return null;
  }
};

window.saveHomepageSettings = async function (settings) {
  try {
    if (!window.currentUserIsAdmin) {
      alert("Only VPAR Admin can update homepage settings.");
      return false;
    }

    const settingsRef = doc(db, "siteSettings", "homepage");
    const updatePayload = {
      eventTitle: settings.eventTitle || "Upcoming Chapter Event",
      eventDate: settings.eventDate || "",
      eventDescription: settings.eventDescription || "",
      heroImageAlt: settings.heroImageAlt || "",
      updatedAt: serverTimestamp()
    };

    if (settings.removeHeroImage) {
      if (settings.existingHeroImagePath) {
        await window.deleteHomepageArticleImage(settings.existingHeroImagePath);
      }

      updatePayload.heroImageUrl = "";
      updatePayload.heroImagePath = "";
      updatePayload.heroImageName = "";
    }

    if (settings.heroImageFile) {
      if (settings.existingHeroImagePath) {
        await window.deleteHomepageArticleImage(settings.existingHeroImagePath);
      }

      const heroImage = await window.uploadHomepageHeroImage(settings.heroImageFile);

      if (heroImage) {
        updatePayload.heroImageUrl = heroImage.url;
        updatePayload.heroImagePath = heroImage.path;
        updatePayload.heroImageName = heroImage.name || "";
      }
    }

    await setDoc(settingsRef, updatePayload, { merge: true });

    
    return true;
  } catch (error) {
    console.error("Failed to save homepage settings:", error);
    alert("Could not save homepage settings.");
    return false;
  }
};

window.loadHomepageArticles = async function () {
  try {
    const articlesSnap = await getDocs(collection(db, "homepageArticles"));

    return articlesSnap.docs
      .map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }))
      .sort((a, b) => {
        const aTime = typeof a.createdAt?.toMillis === "function" ? a.createdAt.toMillis() : 0;
        const bTime = typeof b.createdAt?.toMillis === "function" ? b.createdAt.toMillis() : 0;
        return bTime - aTime;
      });
  } catch (error) {
    console.error("Failed to load homepage articles:", error);
    return [];
  }
};

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Image compression failed."));
    }, type, quality);
  });
}

async function compressHomepageImage(file) {
  const maxDimension = 1600;
  const quality = 0.78;

  if (!file || !file.type?.startsWith("image/")) return file;

  const imageUrl = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.decoding = "async";

    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
      image.src = imageUrl;
    });

    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, "image/jpeg", quality);

    if (blob.size >= file.size && file.type === "image/jpeg") {
      return file;
    }

    const baseName = file.name.replace(/\.[^.]+$/, "") || "homepage-image";
    return new File([blob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now()
    });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

window.uploadHomepageArticleImages = async function (files, articleId) {
  const user = auth.currentUser;
  if (!user) {
    alert("Please sign in before uploading images.");
    return [];
  }

  const imageFiles = Array.from(files || []).filter(file => file?.type?.startsWith("image/"));

  if (!imageFiles.length) return [];

  const uploads = imageFiles.map(async (file, index) => {
    const compressedFile = await compressHomepageImage(file);
    const extension = (compressedFile.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `homepageArticles/${articleId}/${Date.now()}-${index}.${extension}`;
    const storageRef = ref(storage, path);

    await uploadBytes(storageRef, compressedFile, {
      contentType: compressedFile.type || "image/jpeg",
      customMetadata: {
        articleId,
        uploaderEmail: user.email || "",
        originalName: file.name || "",
        originalSize: String(file.size || 0),
        compressedSize: String(compressedFile.size || 0)
      }
    });

    const url = await getDownloadURL(storageRef);
    return {
      url,
      path,
      name: file.name,
      contentType: compressedFile.type || "image/jpeg",
      originalSize: file.size || 0,
      storageSize: compressedFile.size || 0
    };
  });

  return Promise.all(uploads);
};

window.uploadDEIPostImages = async function (files, postId) {
  const user = auth.currentUser;
  if (!user) {
    alert("Please sign in before uploading DEI images.");
    return [];
  }

  const imageFiles = Array.from(files || []).filter(file => file?.type?.startsWith("image/"));
  if (!imageFiles.length) return [];

  const uploads = imageFiles.map(async (file, index) => {
    const compressedFile = await compressHomepageImage(file);
    const extension = (compressedFile.name.split(".").pop() || "jpg")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `deiPosts/${postId}/${Date.now()}-${index}.${extension}`;
    const storageRef = ref(storage, path);

    await uploadBytes(storageRef, compressedFile, {
      contentType: compressedFile.type || "image/jpeg",
      customMetadata: {
        postId,
        uploaderEmail: user.email || "",
        originalName: file.name || "",
        originalSize: String(file.size || 0),
        compressedSize: String(compressedFile.size || 0),
        purpose: "dei-post"
      }
    });

    const url = await getDownloadURL(storageRef);
    return {
      url,
      path,
      name: file.name,
      contentType: compressedFile.type || "image/jpeg",
      originalSize: file.size || 0,
      storageSize: compressedFile.size || 0
    };
  });

  return Promise.all(uploads);
};

window.uploadHomepageHeroImage = async function (file) {
  const user = auth.currentUser;
  if (!user) {
    alert("Please sign in before uploading a homepage image.");
    return null;
  }

  if (!file || !file.type?.startsWith("image/")) return null;

  const compressedFile = await compressHomepageImage(file);
  const extension = (compressedFile.name.split(".").pop() || "jpg")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `homepageHero/${Date.now()}.${extension}`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, compressedFile, {
    contentType: compressedFile.type || "image/jpeg",
    customMetadata: {
      uploaderEmail: user.email || "",
      originalName: file.name || "",
      originalSize: String(file.size || 0),
      compressedSize: String(compressedFile.size || 0),
      purpose: "homepage-hero"
    }
  });

  const url = await getDownloadURL(storageRef);
  return {
    url,
    path,
    name: file.name,
    contentType: compressedFile.type || "image/jpeg",
    originalSize: file.size || 0,
    storageSize: compressedFile.size || 0
  };
};

window.uploadProfileImage = async function (file, profileType, profileId) {
  const user = auth.currentUser;
  if (!user) {
    alert("Please sign in before uploading profile images.");
    return null;
  }

  if (!file || !file.type?.startsWith("image/")) return null;

  try {
    const compressedFile = await compressHomepageImage(file);
    const extension = (compressedFile.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const safeType = String(profileType || "profile").replace(/[^a-z0-9-]/gi, "").toLowerCase();
    const safeId = String(profileId || crypto.randomUUID()).replace(/[^a-z0-9-]/gi, "-").toLowerCase();
    const path = `profileImages/${safeType}/${safeId}-${Date.now()}.${extension}`;
    const storageRef = ref(storage, path);

    await uploadBytes(storageRef, compressedFile, {
      contentType: compressedFile.type || "image/jpeg",
      customMetadata: {
        profileType: safeType,
        profileId: safeId,
        uploaderEmail: user.email || "",
        originalName: file.name || "",
        originalSize: String(file.size || 0),
        compressedSize: String(compressedFile.size || 0)
      }
    });

    const url = await getDownloadURL(storageRef);
    return {
      url,
      path,
      name: file.name,
      contentType: compressedFile.type || "image/jpeg",
      originalSize: file.size || 0,
      storageSize: compressedFile.size || 0
    };
  } catch (error) {
    console.error("Failed to upload profile image:", error);
    alert(`Could not upload this profile image: ${error.code || error.message || "unknown error"}`);
    return null;
  }
};

window.submitProfilePhotoRequest = async function ({ profileType, profileId, profileName, profileEmail, file }) {
  const user = auth.currentUser;

  if (!user) {
    alert("Please sign in before requesting a profile photo update.");
    return null;
  }

  const normalizedType = String(profileType || "").toLowerCase();
  const requesterEmail = String(user.email || "").toLowerCase().trim();
  const targetEmail = String(profileEmail || "").toLowerCase().trim();
  const requesterEmails = new Set([
    requesterEmail,
    window.currentLinkedProfileEmail
  ]
    .map((email) => String(email || "").toLowerCase().trim())
    .filter(Boolean));

  if (normalizedType !== "brother" || !targetEmail || !requesterEmails.has(targetEmail)) {
    alert("You can only request a profile photo update for your own brother profile.");
    return null;
  }

  if (!file || !file.type?.startsWith("image/")) {
    alert("Please choose an image file.");
    return null;
  }

  try {
    const requestId = `${directoryKey({ email: targetEmail || profileName })}-${Date.now()}`;
    const uploaded = await window.uploadProfileImage(file, "pending-brother", requestId);

    if (!uploaded) return null;

    await setDoc(doc(db, "mentorRequests", requestId), {
      profileType: "brother",
      profileId: profileId || directoryKey({ email: targetEmail, name: profileName }),
      profileName: profileName || "",
      profileEmail: profileEmail || "",
      requesterEmail: user.email || "",
      requesterUid: user.uid || "",
      imageUrl: uploaded.url,
      imagePath: uploaded.path,
      type: "profile-photo",
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return requestId;
  } catch (error) {
    console.error("Failed to submit profile photo request:", error);
    alert(`Could not submit this profile photo request: ${error.code || error.message || "unknown error"}`);
    return null;
  }
};

window.loadProfilePhotoRequests = async function () {
  try {
    const requestsSnap = await getDocs(collection(db, "mentorRequests"));

    return requestsSnap.docs
      .map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }))
      .filter((request) => String(request.type || "").toLowerCase() === "profile-photo")
      .sort((a, b) => {
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (a.status !== "pending" && b.status === "pending") return 1;
        const aTime = typeof a.createdAt?.toMillis === "function" ? a.createdAt.toMillis() : 0;
        const bTime = typeof b.createdAt?.toMillis === "function" ? b.createdAt.toMillis() : 0;
        return bTime - aTime;
      });
  } catch (error) {
    console.error("Failed to load profile photo requests:", error);
    return [];
  }
};

window.approveProfilePhotoRequest = async function (requestId) {
  const allowed = await requireLiveAdminAccess("approve profile photo requests");
  if (!allowed) return false;

  try {
    const requestRef = doc(db, "mentorRequests", requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) {
      alert("This profile photo request no longer exists.");
      return false;
    }

    const request = requestSnap.data();
    const profileId = request.profileId || directoryKey({
      email: request.profileEmail,
      name: request.profileName
    });

    await setDoc(doc(db, "brothers", profileId), {
      profileImageUrl: request.imageUrl || "",
      profileImagePath: request.imagePath || "",
      lastUpdatedNote: "Profile photo approved by VPAR",
      updatedAt: serverTimestamp()
    }, { merge: true });

    await setDoc(requestRef, {
      status: "approved",
      reviewedBy: auth.currentUser?.email || "",
      reviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    return true;
  } catch (error) {
    console.error("Failed to approve profile photo request:", error);
    alert("Could not approve this profile photo request.");
    return false;
  }
};

window.rejectProfilePhotoRequest = async function (requestId) {
  const allowed = await requireLiveAdminAccess("reject profile photo requests");
  if (!allowed) return false;

  try {
    const requestRef = doc(db, "mentorRequests", requestId);
    const requestSnap = await getDoc(requestRef);
    const request = requestSnap.exists() ? requestSnap.data() : {};

    if (request.imagePath) {
      await window.deleteHomepageArticleImage(request.imagePath);
    }

    await setDoc(requestRef, {
      status: "rejected",
      reviewedBy: auth.currentUser?.email || "",
      reviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    return true;
  } catch (error) {
    console.error("Failed to reject profile photo request:", error);
    alert("Could not reject this profile photo request.");
    return false;
  }
};

window.deleteHomepageArticleImage = async function (imagePath) {
  if (!imagePath) return true;

  try {
    await deleteObject(ref(storage, imagePath));
    return true;
  } catch (error) {
    console.warn("Could not delete article image from Storage:", error);
    return false;
  }
};

window.saveHomepageArticle = async function (article) {
  try {
    if (!window.currentUserIsAdmin && !window.currentUserIsFamilyHead) {
      alert("Only VPAR Admin and Family Heads can publish homepage updates.");
      return null;
    }

    const articleId = article.id || `${directoryKey({
      name: `${article.category || "update"}-${article.title || "article"}`
    })}-${Date.now()}`;

    let existingArticle = {};

    if (article.id) {
      const existingSnap = await getDoc(doc(db, "homepageArticles", articleId));
      existingArticle = existingSnap.exists() ? existingSnap.data() : {};

      if (!window.currentUserIsAdmin && existingArticle.authorEmail !== auth.currentUser?.email) {
        alert("Only the original Family Head author or VPAR Admin can edit this post.");
        return null;
      }
    }

    const uploadedImages = await window.uploadHomepageArticleImages(article.imageFiles || [], articleId);
    const existingImages = Array.isArray(article.images) ? article.images : [];
    const images = existingImages.concat(uploadedImages);
    const imageUrls = images.map(image => image.url).filter(Boolean);
    const coverImageUrl = imageUrls[0] || post.coverImageUrl || "";
    const user = auth.currentUser;

    await setDoc(doc(db, "homepageArticles", articleId), {
      category: article.category || "Chapter Update",
      title: article.title || "Untitled Update",
      body: article.body || "",
      imageData: "",
      imageAlt: article.imageAlt || "",
      imageUrls,
      images,
      coverImageUrl,
      authorEmail: article.authorEmail || user?.email || "",
      authorUid: article.authorUid || user?.uid || "",
      authorRole: article.authorRole || window.currentUserRole || "",
      createdByFamilyHead: Boolean(article.createdByFamilyHead || window.currentUserIsFamilyHead),
      status: article.status || "published",
      updatedAt: serverTimestamp(),
      createdAt: article.id ? existingArticle.createdAt || serverTimestamp() : serverTimestamp()
    }, { merge: true });

    return articleId;
  } catch (error) {
    console.error("Failed to save homepage article:", error);
    alert("Could not save homepage article. If the post has a large image, try a smaller image.");
    return null;
  }
};

window.deleteHomepageArticle = async function (articleId) {
  try {
    const articleSnap = await getDoc(doc(db, "homepageArticles", articleId));
    const article = articleSnap.exists() ? articleSnap.data() : {};

    if (!window.currentUserIsAdmin && article.authorEmail !== auth.currentUser?.email) {
      alert("Only the original Family Head author or VPAR Admin can delete this post.");
      return false;
    }

    if (Array.isArray(article.images)) {
      await Promise.all(article.images.map(image => window.deleteHomepageArticleImage(image.path)));
    }

    await deleteDoc(doc(db, "homepageArticles", articleId));
    return true;
  } catch (error) {
    console.error("Failed to delete homepage article:", error);
    alert("Could not delete homepage article.");
    return false;
  }
};

// ─── DIRECTORY DATA HELPERS ───────────────────────────────────────────────────
function cleanDirectoryPayload(profile) {
  const cleaned = {};

  Object.entries(profile || {}).forEach(([key, value]) => {
    if (key === "firebaseId") return;
    if (value === undefined) return;
    cleaned[key] = value;
  });

  cleaned.updatedAt = serverTimestamp();
  return cleaned;
}

function directoryKey(profile) {
  return String(profile.email || profile.name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || crypto.randomUUID();
}

window.makeDirectoryKey = directoryKey;

window.loadAlumniProfiles = async function () {
  try {
    const alumniSnap = await getDocs(collection(db, "alumni"));

    return alumniSnap.docs.map((docSnap) => ({
      firebaseId: docSnap.id,
      ...docSnap.data()
    }));
  } catch (error) {
    console.error("Failed to load alumni from Firestore:", error);
    return [];
  }
};

window.loadBrotherProfiles = async function () {
  try {
    const brothersSnap = await getDocs(collection(db, "brothers"));

    return brothersSnap.docs.map((docSnap) => ({
      firebaseId: docSnap.id,
      ...docSnap.data()
    }));
  } catch (error) {
    console.error("Failed to load brothers from Firestore:", error);
    return [];
  }
};

window.loadDirectoryDeletes = async function (type) {
  try {
    const deletesSnap = await getDocs(collection(db, "directoryDeletes"));
    const deletedKeys = [];

    deletesSnap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.type === type && data.key) deletedKeys.push(data.key);
    });

    return deletedKeys;
  } catch (error) {
    console.error("Failed to load directory deletes:", error);
    return [];
  }
};

window.saveAlumniProfile = async function (profile) {
  try {
    const payload = cleanDirectoryPayload(profile);

    const profileId = profile.firebaseId || directoryKey(profile);
    if (!profile.firebaseId) payload.createdAt = serverTimestamp();

    await setDoc(doc(db, "alumni", profileId), payload, { merge: true });
    return profileId;
  } catch (error) {
    console.error("Failed to save alumni profile:", error);
    alert("Could not save alumni profile.");
    return null;
  }
};

window.saveBrotherProfile = async function (profile) {
  try {
    const payload = cleanDirectoryPayload(profile);

    const profileId = profile.firebaseId || directoryKey(profile);
    if (!profile.firebaseId) payload.createdAt = serverTimestamp();

    await setDoc(doc(db, "brothers", profileId), payload, { merge: true });
    return profileId;
  } catch (error) {
    console.error("Failed to save brother profile:", error);
    alert("Could not save brother profile.");
    return null;
  }
};

window.deleteAlumniProfile = async function (firebaseId, profile) {
  try {
    await deleteDoc(doc(db, "alumni", firebaseId));
    await setDoc(doc(db, "directoryDeletes", `alumni-${directoryKey(profile || { name: firebaseId })}`), {
      type: "alumni",
      key: directoryKey(profile || { name: firebaseId }),
      deletedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error("Failed to delete alumni profile:", error);
    alert("Could not delete alumni profile.");
    return false;
  }
};

window.promoteBrotherToAlumni = async function(index) {
  if (window.requireLiveAdminAccess && !(await window.requireLiveAdminAccess("promote brothers to alumni"))) return;

  const b = brothers[index];
  if (!b) return;

  

  try {
    const alumniProfile = {
      name: b.name || "",
      email: b.email || "",
      alternateEmails: b.alternateEmails || [],
      linkedin: b.linkedin || "",
      profileImageUrl: b.profileImageUrl || "",
      profileImagePath: b.profileImagePath || "",
      company: "",
      role: "",
      field: "",
      location: "",
      gradYear: b.year || "",
      pledgeClass: b.pledgeClass || "",
      lastUpdatedNote: `Promoted from active brother ${new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" })}`,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    };

    const profileId = b.firebaseId || directoryKey(b);

    if (window.saveAlumniProfile) {
      const saved = await window.saveAlumniProfile(alumniProfile);
      if (!saved) return;
    }

    if (window.deleteBrotherProfile) {
      const deleted = await window.deleteBrotherProfile(profileId, b);
      if (!deleted) return;
    }

    if (b.email && window.approvePortalUser) {
      await window.approvePortalUser(b.email, "alumni", b.name);
    }

    brothers.splice(index, 1);

    alumni.unshift({
    ...alumniProfile,
    field: majorField(alumniProfile.field || ""),
    firebaseId: b.firebaseId || directoryKey(b)
  });
  brothers.splice(index, 1);

  renderAlumni();
  renderBrothers();
  fillFilters();
  await loadAdminDashboard();

  toast(`${b.name} promoted to alumni.`);

  } catch (error) {
    console.error("Failed to promote brother to alumni:", error);
    alert("Could not promote this brother to alumni.");
  }
};

window.deleteBrotherProfile = async function (firebaseId, profile) {
  try {
    await deleteDoc(doc(db, "brothers", firebaseId));
    await setDoc(doc(db, "directoryDeletes", `brother-${directoryKey(profile || { name: firebaseId })}`), {
      type: "brother",
      key: directoryKey(profile || { name: firebaseId }),
      deletedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error("Failed to delete brother profile:", error);
    alert("Could not delete brother profile.");
    return false;
  }
};

window.loadPortalAccessMaps = async function () {
  try {
    if (!auth.currentUser) {
      console.warn("Portal access maps requested before sign-in.");
      return { approvedUsers: {}, familyHeads: {} };
    }

    const [approvedSnap, familyHeadSnap, deiEditorSnap] = await Promise.all([
      getDocs(collection(db, "approvedUsers")),
      getDocs(collection(db, "familyHeads")),
      getDocs(collection(db, "deiEditors"))
    ]);

    const approvedUsers = {};
    const familyHeads = {};
    const deiEditors = {};

    approvedSnap.forEach((docSnap) => {
      approvedUsers[docSnap.id] = docSnap.data();
    });

    familyHeadSnap.forEach((docSnap) => {
      familyHeads[docSnap.id] = docSnap.data();
    });

    deiEditorSnap.forEach((docSnap) => {
      deiEditors[docSnap.id] = docSnap.data();
    });

    return { approvedUsers, familyHeads, deiEditors };
  } catch (error) {
    console.error("Failed to load portal access maps:", error);
    alert(`Could not load portal access records: ${error.code || error.message || "unknown error"}`);
    return { approvedUsers: {}, familyHeads: {}, deiEditors: {} };
  }
};

async function requireLiveAdminAccess(actionLabel) {
  const user = auth.currentUser;

  if (!user) {
    alert("Please sign in before changing portal access.");
    return false;
  }

  const isAdmin = await checkAdminAccess(user);
  window.currentUserIsAdmin = isAdmin;

  if (!isAdmin) {
    alert(`Only VPAR Admin can ${actionLabel}.`);
    return false;
  }

  return true;
}

window.requireLiveAdminAccess = requireLiveAdminAccess;

window.approvePortalUser = async function (email, role, name = "") {
  try {
    if (!(await requireLiveAdminAccess("approve portal users"))) return false;

    if (!email) {
      alert("This profile needs an email before login can be approved.");
      return false;
    }

    const normalizedRole = String(role || "").toLowerCase();
    if (!["brother", "alumni"].includes(normalizedRole)) {
      alert("Portal role must be brother or alumni.");
      return false;
    }

    await setDoc(doc(db, "approvedUsers", safeEmailKey(email)), {
      email,
      name,
      role: normalizedRole,
      linkedProfileEmail: String(email || "").toLowerCase().trim(),
      linkedProfileName: name || "",
      approvedBy: auth.currentUser?.email || "",
      approvedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    if (auth.currentUser?.email === email) {
      await hydratePortalAccess(auth.currentUser);
    }

    
    return true;
  } catch (error) {
    console.error("Failed to approve portal user:", error);
    alert(`Could not approve this portal user: ${error.code || error.message || "unknown error"}`);
    return false;
  }
};

function profileLoginEmails(profile) {
  const alternateEmails = Array.isArray(profile?.alternateEmails)
    ? profile.alternateEmails
    : String(profile?.alternateEmail || "").split(/[,;\n]/);

  return [profile?.email, ...alternateEmails]
    .map((email) => String(email || "").toLowerCase().trim())
    .filter(Boolean);
}

window.syncProfileLoginAccess = async function (profile, role) {
  try {
    if (!(await requireLiveAdminAccess("sync alternate login emails"))) return false;

    const normalizedRole = String(role || "").toLowerCase().trim();
    if (!["brother", "alumni"].includes(normalizedRole)) {
      alert("Profile login role must be brother or alumni.");
      return false;
    }

    const primaryEmail = String(profile?.email || "").toLowerCase().trim();
    const emails = [...new Set(profileLoginEmails(profile))];

    if (!primaryEmail || !emails.length) return true;

    await Promise.all(emails.map((email) => setDoc(doc(db, "approvedUsers", safeEmailKey(email)), {
      email,
      name: profile.name || "",
      role: normalizedRole,
      linkedProfileEmail: primaryEmail,
      linkedProfileName: profile.name || "",
      approvedBy: auth.currentUser?.email || "",
      approvedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true })));

    if (auth.currentUser && emails.includes(String(auth.currentUser.email || "").toLowerCase().trim())) {
      await hydratePortalAccess(auth.currentUser);
    }

    
    return true;
  } catch (error) {
    console.error("Failed to sync profile login access:", error);
    alert(`Could not sync alternate login emails: ${error.code || error.message || "unknown error"}`);
    return false;
  }
};

window.removePortalUserApproval = async function (email) {
  try {
    if (!(await requireLiveAdminAccess("remove portal access"))) return false;

    if (!email) {
      alert("This profile does not have an email.");
      return false;
    }

    await deleteDoc(doc(db, "approvedUsers", safeEmailKey(email)));
    
    return true;
  } catch (error) {
    console.error("Failed to remove portal approval:", error);
    alert(`Could not remove portal access: ${error.code || error.message || "unknown error"}`);
    return false;
  }
};

window.setFamilyHeadAccess = async function (email, enabled, name = "") {
  try {
    if (!(await requireLiveAdminAccess("change Family Head access"))) return false;

    if (!email) {
      alert("This profile needs an email before Family Head access can be changed.");
      return false;
    }

    const familyHeadRef = doc(db, "familyHeads", safeEmailKey(email));

    if (enabled) {
      await setDoc(familyHeadRef, {
        email,
        name,
        active: true,
        title: "Family Head",
        grantedBy: auth.currentUser?.email || "",
        updatedAt: serverTimestamp()
      }, { merge: true });
    } else {
      await deleteDoc(familyHeadRef);
    }

    if (auth.currentUser?.email === email) {
      await hydratePortalAccess(auth.currentUser);
    }

    
    return true;
  } catch (error) {
    console.error("Failed to update Family Head access:", error);
    alert(`Could not update Family Head access: ${error.code || error.message || "unknown error"}`);
    return false;
  }
};

window.setDEIEditorAccess = async function (email, categories = [], name = "") {
  try {
    if (!(await requireLiveAdminAccess("change DEI posting access"))) return false;

    if (!email) {
      alert("This person needs an email before DEI posting access can be changed.");
      return false;
    }

    const allowedCategories = ["overview", "resources", "events", "feedback"];
    const categoryMap = {};

    allowedCategories.forEach((category) => {
      categoryMap[category] = categories.includes(category);
    });

    const hasAnyCategory = Object.values(categoryMap).some(Boolean);
    const deiEditorRef = doc(db, "deiEditors", safeEmailKey(email));

    if (hasAnyCategory) {
      await setDoc(deiEditorRef, {
        email,
        name,
        active: true,
        categories: categoryMap,
        grantedBy: auth.currentUser?.email || "",
        updatedAt: serverTimestamp()
      }, { merge: true });
    } else {
      await deleteDoc(deiEditorRef);
    }

    if (auth.currentUser?.email === email) {
      await hydratePortalAccess(auth.currentUser);
    }

    
    return true;
  } catch (error) {
    console.error("Failed to update DEI editor access:", error);
    alert(`Could not update DEI posting access: ${error.code || error.message || "unknown error"}`);
    return false;
  }
};

window.saveHandoffNotes = async function() {
  if (!window.currentUserIsAdmin) {
    alert("Only VPAR Admin can save handoff notes.");
    return;
  }

  const fields = {
    approveUsers: document.getElementById("handoffApproveUsers")?.value.trim() || "",
    updateData: document.getElementById("handoffUpdateData")?.value.trim() || "",
    postUpdates: document.getElementById("handoffPostUpdates")?.value.trim() || "",
    promoteSeniors: document.getElementById("handoffPromoteSeniors")?.value.trim() || "",
    mentorship: document.getElementById("handoffMentorship")?.value.trim() || "",
    other: document.getElementById("handoffOther")?.value.trim() || ""
  };

  try {
    await setDoc(doc(db, "siteSettings", "handoffNotes"), {
      ...fields,
      updatedAt: serverTimestamp(),
      updatedBy: auth.currentUser?.email || ""
    }, { merge: true });
    toast("Handoff notes saved.");
  } catch (error) {
    console.error("Failed to save handoff notes:", error);
    alert("Could not save handoff notes.");
  }
};

async function loadHandoffNotes() {
  try {
    const snap = await getDoc(doc(db, "siteSettings", "handoffNotes"));
    if (!snap.exists()) return;
    const data = snap.data();
    const fields = {
      handoffApproveUsers: data.approveUsers,
      handoffUpdateData: data.updateData,
      handoffPostUpdates: data.postUpdates,
      handoffPromoteSeniors: data.promoteSeniors,
      handoffMentorship: data.mentorship,
      handoffOther: data.other
    };
    Object.entries(fields).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el && value) el.value = value;
    });
  } catch (error) {
    console.error("Failed to load handoff notes:", error);
  }
}

window.loadHandoffNotes = loadHandoffNotes;

window.loadAnalyticsDashboard = async function() {
  const content = document.getElementById("analyticsContent");
  if (!content) return;

  content.innerHTML = `<div class="mentor-alert">Crunching the numbers...</div>`;

  const [mentorRequests, menteeRequests, pairings, editRequests] = await Promise.all([
    window.loadAdminMentorRequests ? window.loadAdminMentorRequests() : [],
    window.loadAdminMenteeRequests ? window.loadAdminMenteeRequests() : [],
    window.loadMentorshipPairings ? window.loadMentorshipPairings() : [],
    window.loadProfileEditRequests ? window.loadProfileEditRequests() : []
  ]);

  const totalAlumni = alumni.length;
  const totalBrothers = brothers.length;
  const totalPairings = pairings.length;
  const pendingEdits = editRequests.filter(r => r.status === "pending").length;
  const pendingMentorRequests = mentorRequests.filter(r => r.status === "pending").length;

  const companyCounts = {};
  alumni.forEach(a => {
    if (a.company) companyCounts[a.company] = (companyCounts[a.company] || 0) + 1;
  });
  const topCompanies = Object.entries(companyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const fieldCounts = {};
  alumni.forEach(a => {
    if (a.field) fieldCounts[a.field] = (fieldCounts[a.field] || 0) + 1;
  });
  const topFields = Object.entries(fieldCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const pledgeCounts = {};
  alumni.forEach(a => {
    const pc = a.pledgeClass || "Unknown";
    pledgeCounts[pc] = (pledgeCounts[pc] || 0) + 1;
  });
  const topPledgeClasses = Object.entries(pledgeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const alumniWithLinkedIn = alumni.filter(a => a.linkedin).length;
  const alumniWithEmail = alumni.filter(a => a.email).length;
  const alumniWithPhoto = alumni.filter(a => a.profileImageUrl).length;

  content.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:24px;">
      ${[
        ["Total Alumni", totalAlumni, "var(--gold2)"],
        ["Total Brothers", totalBrothers, "var(--gold2)"],
        ["Active Pairings", totalPairings, "#9df0b4"],
        ["Pending Mentor Requests", pendingMentorRequests, "#ff9f7f"],
        ["Pending Profile Edits", pendingEdits, "#ff9f7f"],
        ["Alumni with LinkedIn", alumniWithLinkedIn, "var(--gold2)"],
        ["Alumni with Email", alumniWithEmail, "var(--gold2)"],
        ["Alumni with Photo", alumniWithPhoto, "var(--gold2)"]
      ].map(([label, value, color]) => `
        <div class="mentor-alert admin-metric-card" style="min-height:100px;">
          <h3>${esc(label)}</h3>
          <p style="color:${color};font-size:28px;font-weight:900;margin:10px 0 0;">${value}</p>
        </div>
      `).join("")}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:18px;">
      <div class="mentor-alert">
        <h3 style="margin-bottom:14px;">Top Companies</h3>
        ${topCompanies.map(([company, count]) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.08);">
            <span style="font-size:13px;color:rgba(234,240,251,.88);">${esc(company)}</span>
            <span style="color:var(--gold2);font-weight:900;font-size:13px;">${count}</span>
          </div>
        `).join("")}
      </div>

      <div class="mentor-alert">
        <h3 style="margin-bottom:14px;">Top Fields</h3>
        ${topFields.map(([field, count]) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.08);">
            <span style="font-size:13px;color:rgba(234,240,251,.88);">${esc(field)}</span>
            <span style="color:var(--gold2);font-weight:900;font-size:13px;">${count}</span>
          </div>
        `).join("")}
      </div>

      <div class="mentor-alert">
        <h3 style="margin-bottom:14px;">Alumni by Pledge Class</h3>
        ${topPledgeClasses.map(([pc, count]) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.08);">
            <span style="font-size:13px;color:rgba(234,240,251,.88);">${esc(pc)}</span>
            <span style="color:var(--gold2);font-weight:900;font-size:13px;">${count}</span>
          </div>
        `).join("")}
      </div>
    </div>
  `;
};

window.loadProfileEditRequests = async function() {
  try {
    const snap = await getDocs(collection(db, "profileEditRequests"));
    return snap.docs
      .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
      .sort((a, b) => {
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (a.status !== "pending" && b.status === "pending") return 1;
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
  } catch (error) {
    console.error("Failed to load profile edit requests:", error);
    return [];
  }
};

window.approveProfileEditRequest = async function(requestId) {
  if (!(await requireLiveAdminAccess("approve profile edit requests"))) return false;

  try {
    const requestRef = doc(db, "profileEditRequests", requestId);
    const requestSnap = await getDoc(requestRef);
    if (!requestSnap.exists()) {
      alert("This request no longer exists.");
      return false;
    }

    const request = requestSnap.data();
    const profileId = request.profileId;
    const updates = { ...request.changes, updatedAt: serverTimestamp() };

    if (request.newImageUrl) {
      updates.profileImageUrl = request.newImageUrl;
      updates.profileImagePath = request.newImagePath || "";
    }

    updates.lastUpdatedNote = `Self-updated ${new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;

    await setDoc(doc(db, "alumni", profileId), updates, { merge: true });

    await setDoc(requestRef, {
      status: "approved",
      reviewedBy: auth.currentUser?.email || "",
      reviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    if (!alumni.length || !brothers.length) {
  await loadFirebaseData();
}
    renderAlumni();
    fillFilters();
    toast("Profile edit approved and live.");
    return true;
  } catch (error) {
    console.error("Failed to approve profile edit:", error);
    alert("Could not approve this edit.");
    return false;
  }
};

window.rejectProfileEditRequest = async function(requestId) {
  if (!(await requireLiveAdminAccess("reject profile edit requests"))) return false;

  try {
    const requestRef = doc(db, "profileEditRequests", requestId);
    const requestSnap = await getDoc(requestRef);
    const request = requestSnap.exists() ? requestSnap.data() : {};

    if (request.newImagePath) {
      await window.deleteHomepageArticleImage(request.newImagePath);
    }

    await setDoc(requestRef, {
      status: "rejected",
      reviewedBy: auth.currentUser?.email || "",
      reviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    toast("Profile edit rejected.");
    return true;
  } catch (error) {
    console.error("Failed to reject profile edit:", error);
    alert("Could not reject this edit.");
    return false;
  }
};

async function loadProfileEditRequestsIntoAdmin() {
  const list = document.getElementById("adminProfileEditsList");
  if (!list) return;

  list.innerHTML = `<div class="mentor-alert">Loading profile edit requests...</div>`;

  const requests = await window.loadProfileEditRequests();

  if (!requests.length) {
    list.innerHTML = `<div class="mentor-alert">No profile edit requests yet.</div>`;
    return;
  }

  list.innerHTML = requests.map(request => {
    const status = String(request.status || "pending").toLowerCase();
    const isPending = status === "pending";
    const changesList = Object.entries(request.changes || {})
      .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
      .join("");

    return `
      <div class="mentor-alert" style="margin-bottom:12px;">
        ${request.newImageUrl ? `
          <div style="margin-bottom:12px;">
            <img src="${request.newImageUrl}" alt="Proposed profile photo" style="width:72px;height:72px;object-fit:cover;border-radius:50%;border:1px solid rgba(224,189,100,.32);">
          </div>
        ` : ""}
        <strong>${request.profileName || "Alumni"}</strong>
        <span style="display:block;color:var(--muted);margin:4px 0 8px;">${request.profileEmail || ""} · Submitted by ${request.submittedBy || "N/A"}</span>
        ${changesList ? `<ul style="margin:0 0 10px;padding-left:18px;color:rgba(220,229,248,.82);font-size:13px;">${changesList}</ul>` : ""}
        ${request.newImageUrl ? `<p style="font-size:13px;color:var(--muted);">+ New profile photo submitted</p>` : ""}
        <small style="color:rgba(255,255,255,.45);">Status: ${status}</small>
        <div class="admin-card-actions">
          ${isPending ? `
            <button class="gold" type="button" onclick="approveProfileEditRequest('${request.id}').then(() => loadProfileEditRequestsIntoAdmin())">Approve</button>
            <button type="button" onclick="rejectProfileEditRequest('${request.id}').then(() => loadProfileEditRequestsIntoAdmin())">Reject</button>
          ` : `<span class="dashboard-pill">${status}</span>`}
        </div>
      </div>
    `;
  }).join("");
}

window.loadProfileEditRequestsIntoAdmin = loadProfileEditRequestsIntoAdmin;

window.loadDEIPosts = async function () {
  try {
    const postsSnap = await getDocs(collection(db, "deiPosts"));

    return postsSnap.docs
      .map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }))
      .sort((a, b) => {
        const aTime = a.updatedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
        const bTime = b.updatedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
  } catch (error) {
    console.error("Failed to load DEI posts:", error);
    return [];
  }
};

window.saveDEIPost = async function (post) {
  try {
    const user = auth.currentUser;
    if (!user) {
      alert("Please sign in before posting to DEI.");
      return null;
    }

    const category = String(post.category || "").toLowerCase();
    const allowedCategories = ["overview", "resources", "events", "feedback"];
    if (!allowedCategories.includes(category)) {
      alert("Choose a valid DEI tab.");
      return null;
    }

    const deiAccess = window.currentUserIsAdmin
      ? { canPost: true, categories: allowedCategories }
      : await loadCurrentDEIAccess(user);

    if (!window.currentUserIsAdmin && !deiAccess.categories.includes(category)) {
      alert("You do not have posting access for this DEI tab.");
      return null;
    }

    const postId = post.id || `dei-${Date.now()}`;
    let existingPost = {};

    if (post.id) {
      const existingSnap = await getDoc(doc(db, "deiPosts", postId));
      existingPost = existingSnap.exists() ? existingSnap.data() : {};

      if (!window.currentUserIsAdmin && existingPost.authorEmail !== user.email) {
        alert("Only the original author or VPAR Admin can edit this DEI post.");
        return null;
      }
    }

    const uploadedImages = await window.uploadDEIPostImages(post.imageFiles || [], postId);
    const existingImages = Array.isArray(post.images) ? post.images : [];
    const images = existingImages.concat(uploadedImages);
    const imageUrls = images.map(image => image.url).filter(Boolean);
    const coverImageUrl = imageUrls[0] || post.coverImageUrl || "";

    await setDoc(doc(db, "deiPosts", postId), {
      category,
      title: post.title || "",
      body: post.body || "",
      status: post.status || "published",
      imageData: "",
      imageAlt: post.imageAlt || "",
      imageUrls,
      images,
      coverImageUrl,
      links: Array.isArray(post.links) ? post.links : [],
      authorEmail: user.email,
      authorName: post.authorName || user.displayName || "",
      updatedAt: serverTimestamp(),
      createdAt: post.id ? existingPost.createdAt || serverTimestamp() : serverTimestamp()
    }, { merge: true });

    return postId;
  } catch (error) {
    console.error("Failed to save DEI post:", error);
    alert(`Could not save DEI post: ${error.code || error.message || "unknown error"}`);
    return null;
  }
};

window.deleteDEIPost = async function (postId) {
  try {
    const user = auth.currentUser;
    if (!user) {
      alert("Please sign in before deleting a DEI post.");
      return false;
    }

    const postSnap = await getDoc(doc(db, "deiPosts", postId));
    const post = postSnap.exists() ? postSnap.data() : null;

    if (!post) return true;

    if (!window.currentUserIsAdmin && post.authorEmail !== user.email) {
      alert("Only the original author or VPAR Admin can delete this DEI post.");
      return false;
    }

    if (Array.isArray(post.images)) {
      await Promise.all(post.images.map(image => window.deleteHomepageArticleImage(image.path)));
    }

    await deleteDoc(doc(db, "deiPosts", postId));
    return true;
  } catch (error) {
    console.error("Failed to delete DEI post:", error);
    alert(`Could not delete DEI post: ${error.code || error.message || "unknown error"}`);
    return false;
  }
};

window.dispatchEvent(new Event("firebaseHelpersReady"));

let portalDataLoadPromise = null;

async function loadApprovedPortalData() {
  if (portalDataLoadPromise) return portalDataLoadPromise;

  portalDataLoadPromise = (async () => {
    if (window.init) await window.init();
    if (window.loadHomepageSettingsIntoPage) await window.loadHomepageSettingsIntoPage();
    if (window.loadHomepageArticlesIntoPage) await window.loadHomepageArticlesIntoPage();
    if (window.loadHomepageMentorshipStatusIntoPage) await window.loadHomepageMentorshipStatusIntoPage();
    if (window.loadDEIPostsIntoPage) await window.loadDEIPostsIntoPage();
    if (window.refreshOwnPhotoRequestState) await window.refreshOwnPhotoRequestState();
    if (window.checkAndShowMyMentorshipBtn) await window.checkAndShowMyMentorshipBtn();
  })();

  return portalDataLoadPromise;
}

// ─── SIGN IN ──────────────────────────────────────────────────────────────────
const signInBtn = document.getElementById("googleSignInBtn");

if (signInBtn) {
  signInBtn.addEventListener("click", async () => {
    try {
      provider.setCustomParameters({
  prompt: "select_account"
});

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const safeEmail = safeEmailKey(user.email);
      const userRef = doc(db, "approvedUsers", safeEmail);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        
        const access = await hydratePortalAccess(user);

        const adminPanelBtn = document.getElementById("adminPanelBtn");
        if (adminPanelBtn) {
          adminPanelBtn.style.display = access.isAdmin ? "inline-flex" : "none";
        }

        setLoginOverlayVisible(false);
        markPortalBooted();

        // Sync Google profile photo to brother record (only fills empty slots, fire-and-forget)
        if (user.photoURL) {
          fetch('/api/brothers/sync-photo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, photoUrl: user.photoURL }),
          }).catch(() => {});
        }

        await loadApprovedPortalData();

        const assignedMentorsRef = collection(
          db,
          "users",
          safeEmail,
          "assignedMentors"
        );

        const assignedMentorsSnap = await getDocs(assignedMentorsRef);
        const assignedMentorBox = document.getElementById("assignedMentorBox");

        if (assignedMentorBox && !assignedMentorsSnap.empty) {
          const mentor = assignedMentorsSnap.docs[0].data();
          const mentorName = mentor.name || "Unknown";
          const initials = mentorName
            .split(" ")
            .filter(Boolean)
            .map(n => n[0])
            .join("");

          const progressList = document.getElementById("progressList");
          if (progressList) {
            const totalCheckIns = Math.max(1, Number(mentor.totalCheckIns || mentor.semesterCheckIns || 3));
            const completedCheckIns = Math.min(totalCheckIns, Math.max(0, Number(mentor.completedCheckIns || 0)));
            const progressPercent = Math.round((completedCheckIns / totalCheckIns) * 100);

            progressList.innerHTML = `
              <div class="mentor-progress-row">
                <strong>${completedCheckIns} of ${totalCheckIns} semester check-ins complete</strong>
                <span>${progressPercent}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="width:${progressPercent}%;"></div>
              </div>
              <div class="mentor-meta">
                ${esc(mentor.progressNote || "No progress yet. VPAR will update this after check-ins begin.")}
              </div>
            `;
          }

          assignedMentorBox.innerHTML = `
            <div class="mentor-avatar">${esc(initials)}</div>
            <div>
              <h3>${esc(mentorName)}</h3>
              <div class="mentor-title">
                ${esc(mentor.role || "Role N/A")} · ${esc(mentor.company || "Company N/A")}
              </div>
              <div class="mentor-meta">
                Assigned through the Alumni x Brotherhood Mentorship Program
              </div>
              <div class="dashboard-pill-row">
                <span class="dashboard-pill">Mentor Assigned</span>
                <span class="dashboard-pill">${esc(mentor.status || "Active")}</span>
              </div>
            </div>
          `;
        }
      } else {
        setPortalAccessState({ user: null });
        alert("You are not approved for access.");
        await auth.signOut();
        setLoginOverlayVisible(true);
        markPortalBooted();
      }
    } catch (error) {
      console.error("FULL LOGIN ERROR:", error);
      alert(error.code + " - " + error.message);
    }
  });
} else {
  console.warn("Sign-in button (#googleSignInBtn) not found in DOM.");
}


// ─── AUTH STATE LISTENER ──────────────────────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
  const adminPanelBtn = document.getElementById("adminPanelBtn");

  if (!adminPanelBtn) {
    markPortalBooted();
    return;
  }

  try {
    if (user) {
      

      const safeEmail = safeEmailKey(user.email);
      const userRef = doc(db, "approvedUsers", safeEmail);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const access = await hydratePortalAccess(user);
        adminPanelBtn.style.display = access.isAdmin ? "inline-flex" : "none";
        setLoginOverlayVisible(false);
        markPortalBooted();

        await loadApprovedPortalData();
      } else {
        setPortalAccessState({ user: null });
        adminPanelBtn.style.display = "none";
        await auth.signOut();
        setLoginOverlayVisible(true);
        markPortalBooted();
      }
    } else {
      setPortalAccessState({ user: null });
      adminPanelBtn.style.display = "none";
      setLoginOverlayVisible(true);
      markPortalBooted();
    }
  } catch (error) {
    console.error("Auth startup failed:", error);
    setPortalAccessState({ user: null });
    adminPanelBtn.style.display = "none";
    setLoginOverlayVisible(true);
    markPortalBooted();
  }
});


// ─── IMPORT HELPERS ────────────────────────────────────────────────────────────
window.importAlumni = async function() {
  const response = await fetch("alumni.json");
  const alumni = await response.json();

  for (const alum of alumni) {
    await setDoc(doc(db, "alumni", directoryKey(alum)), {
      ...alum,
      importedAt: serverTimestamp()
    }, { merge: true });
    
  }

  
};

window.importBrothers = async function() {
  const response = await fetch("brothers.json");
  const brothers = await response.json();

  for (const brother of brothers) {
    await setDoc(doc(db, "brothers", directoryKey(brother)), {
      ...brother,
      importedAt: serverTimestamp()
    }, { merge: true });
    
  }

  
};
