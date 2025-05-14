import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  updateDoc,
  Timestamp
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import {
  getAuth,
  signOut
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAdLXqE3DZXH9R0TWAMSBdpUWGO9KmjU1U",
  authDomain: "basic-272bd.firebaseapp.com",
  projectId: "basic-272bd",
  storageBucket: "basic-272bd.appspot.com",
  messagingSenderId: "382607868032",
  appId: "1:382607868032:web:1271dea9c63fcb23c72665"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore();

// Container for applications
const container = document.getElementById("appContainer");

// Listen for changes to applications in Firestore
onSnapshot(collection(db, "applications"), (snapshot) => {
  container.innerHTML = "";
  const shown = new Set();

  snapshot.forEach((docSnap) => {
    const appId = docSnap.id;
    const data = docSnap.data();

    // Create a unique key for each application
    const key = `${data.fullName}-${data.serviceName}`;
    if (shown.has(key)) return; // Skip if already shown
    shown.add(key);

    const card = document.createElement("div");
    card.className = "application-card";

    card.innerHTML = `
      <h3>${data.serviceName}</h3>
      <p><strong>Applicant:</strong> ${data.fullName}</p>
      <p><strong>Email:</strong> ${data.email || "N/A"}</p>
      <p><strong>Status:</strong> <span class="status ${data.status?.toLowerCase()}">${data.status}</span></p>
      <div class="card-actions">
        <button class="approve-btn" data-id="${appId}">Approve</button>
        <button class="reject-btn" data-id="${appId}">Reject</button>
      </div>
    `;

    container.appendChild(card);
  });

  // Attach handlers for approve and reject buttons
  document.querySelectorAll(".approve-btn").forEach((btn) => {
    btn.onclick = () => handleStatusUpdate(btn.dataset.id, "Approved");
  });

  document.querySelectorAll(".reject-btn").forEach((btn) => {
    btn.onclick = () => handleStatusUpdate(btn.dataset.id, "Rejected");
  });
});

// Function to handle status updates of applications
async function handleStatusUpdate(appId, newStatus) {
  const appRef = doc(db, "applications", appId);
  await updateDoc(appRef, {
    status: newStatus,
    reviewedAt: Timestamp.now()
  });
}

// Firebase authentication
const auth = getAuth();

// Logout functionality
document.getElementById("logout").addEventListener("click", (e) => {
  e.preventDefault(); // Prevent the default link behavior
  signOut(auth)
    .then(() => {
      console.log("✅ Logged out");
      window.location.href = "home.html"; // Redirect to home page after logout
    })
    .catch((error) => {
      console.error("❌ Logout failed:", error);
    });
});
