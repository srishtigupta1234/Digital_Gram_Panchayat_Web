// admin.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  deleteDoc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// --- Firebase init ---
const firebaseConfig = {
  apiKey: "AIzaSyAdLXqE3DZXH9R0TWAMSBdpUWGO9KmjU1U",
  authDomain: "basic-272bd.firebaseapp.com",
  projectId: "basic-272bd",
  storageBucket: "basic-272bd.appspot.com",
  messagingSenderId: "382607868032",
  appId: "1:382607868032:web:1271dea9c63fcb23c72665"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Logout ---
document.getElementById("logoutBtn").addEventListener("click", e => {
  e.preventDefault();
  signOut(auth).then(() => location.href = "index.html");
});

// --- Load & Render Services ---
export async function loadServices() {
  const listEl = document.getElementById("servicesList");
  listEl.innerHTML = "<p>Loading services…</p>";
  try {
    const snapshot = await getDocs(collection(db, "services"));
    listEl.innerHTML = "";
    if (snapshot.empty) {
      listEl.innerHTML = "<p>No services found.</p>";
      return;
    }
    snapshot.forEach(docSnap => {
      const s = docSnap.data();
      const card = document.createElement("div");
      card.className = "service-card";
      card.innerHTML = `
        <h3>${s.serviceName}</h3>
        <p>${s.description}</p>
        <div class="service-meta">
          <span><strong>Dept:</strong> ${s.department}</span>
          <span><strong>Fee:</strong> ₹${s.fees || 0}</span>
        </div>
        <div class="service-meta">
          <span><strong>Eligibility:</strong> ${s.eligibility}</span>
        </div>
        <div class="service-meta">
          <span><strong>Docs:</strong> ${s.documents}</span>
        </div>
        <div class="service-actions">
          <a href="javascript:void(0)" onclick="updateService('${docSnap.id}')" class="btn btn-primary">✏️ Edit</a>
          <a href="javascript:void(0)" onclick="deleteService('${docSnap.id}')" class="btn btn-danger">❌ Delete</a>
        </div>
      `;
      listEl.appendChild(card);
    });
  } catch (err) {
    listEl.innerHTML = "<p>Error loading services.</p>";
    console.error(err);
  }
}

// --- Delete Service ---
window.deleteService = async function(serviceId) {
  if (!confirm("Are you sure you want to delete this service?")) return;
  try {
    await deleteDoc(doc(db, "services", serviceId));
    alert("Service deleted.");
    loadServices();
  } catch (err) {
    console.error(err);
    alert("Error deleting service: " + err.message);
  }
};

// --- Update Service (prompt‑based) ---
window.updateService = async function(serviceId) {
  try {
    const ref = doc(db, "services", serviceId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      alert("Service not found!");
      return;
    }
    const data = snap.data();

    // Prompt user for each field (pre‑fill with existing value)
    const updated = {};
    updated.serviceName = prompt("Service Title:", data.serviceName) || data.serviceName;
    updated.description = prompt("Description:", data.description) || data.description;
    updated.eligibility = prompt("Eligibility:", data.eligibility) || data.eligibility;
    updated.documents = prompt("Documents Needed:", data.documents) || data.documents;
    const feeInput = prompt("Service Fee (₹):", data.fees ?? "0");
    updated.fees = isNaN(parseInt(feeInput)) ? data.fees : parseInt(feeInput);
    updated.department = prompt("Department/Section:", data.department) || data.department;

    // Write updates
    await updateDoc(ref, {
      ...updated
    });
    alert("Service updated successfully!");
    loadServices();
  } catch (err) {
    console.error(err);
    alert("Error updating service: " + err.message);
  }
};

// --- On page load ---
loadServices();
