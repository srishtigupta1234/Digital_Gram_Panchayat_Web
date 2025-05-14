import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  updateDoc,
  Timestamp
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAdLXqE3DZXH9R0TWAMSBdpUWGO9KmjU1U",
  authDomain: "basic-272bd.firebaseapp.com",
  projectId: "basic-272bd",
  storageBucket: "basic-272bd.appspot.com",
  messagingSenderId: "382607868032",
  appId: "1:382607868032:web:1271dea9c63fcb23c72665"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const applicationsRef = collection(db, "applications");
const container = document.querySelector(".applications-section");

function formatKey(k) {
  return k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function renderField(key, val) {
  if (Array.isArray(val)) {
    return `<div><strong>${formatKey(key)}:</strong>
      <ul>${val.map((v, i) =>
        v.startsWith("http")
          ? `<li><a href="${v}" target="_blank">Document ${i + 1}</a></li>`
          : `<li>${v}</li>`
      ).join("")}</ul></div>`;
  }
  if (val && typeof val === "object") {
    return `<div><strong>${formatKey(key)}:</strong>${renderObject(val)}</div>`;
  }
  return `<p><strong>${formatKey(key)}:</strong> ${val}</p>`;
}

function renderObject(obj) {
  return Object.entries(obj).map(([k, v]) => renderField(k, v)).join("");
}

onSnapshot(applicationsRef, (snapshot) => {
  container.innerHTML = `<h2>All Applications</h2>`;
  const seen = new Set();

  snapshot.forEach((docSnap) => {
    const id = docSnap.id;
    const data = docSnap.data();
    if (seen.has(data.aadhar)) return; // prevent duplicates
    seen.add(data.aadhar);

    const status = data.status || "Pending";
    const appliedDate = data.appliedAt?.toDate().toLocaleString() || "N/A";

    const exclude = [
      "serviceName", "fullName", "aadhar", "village", "appliedAt", "status",
      "uid", "serviceId"
    ];

    const extraHTML = Object.entries(data)
      .filter(([k]) => !exclude.includes(k))
      .map(([k, v]) => renderField(k, v))
      .join("");

    const card = document.createElement("div");
    card.className = "application-card";
    card.innerHTML = `
      <h3>Service: ${data.serviceName}</h3>
      <p><strong>User:</strong> ${data.fullName}</p>
      <p><strong>Aadhar:</strong> ${data.aadhar}</p>
      <p><strong>Village:</strong> ${data.village}</p>
      <p><strong>Submitted On:</strong> ${appliedDate}</p>
      <p><strong>Status:</strong> 
        <span class="status ${status.toLowerCase()}">${status}</span>
      </p>
      <div class="card-actions">
        <button class="view-btn" data-id="${id}" data-open="false">View More</button>
        <button class="approve-btn" data-id="${id}">Approve</button>
        <button class="reject-btn" data-id="${id}">Reject</button>
      </div>
      <div id="more-${id}" style="display:none; margin-top:10px;">
        ${extraHTML}
      </div>
    `;

    container.appendChild(card);
  });

  addListeners();
});

function addListeners() {
  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      const more = document.getElementById(`more-${id}`);
      const isOpen = btn.dataset.open === "true";
      btn.dataset.open = isOpen ? "false" : "true";
      btn.textContent = isOpen ? "View More" : "View Less";
      more.style.display = isOpen ? "none" : "block";
    };
  });

  document.querySelectorAll(".approve-btn").forEach((btn) => {
    btn.onclick = () => handleStatusChange(btn.dataset.id, "Approved");
  });

  document.querySelectorAll(".reject-btn").forEach((btn) => {
    btn.onclick = () => handleStatusChange(btn.dataset.id, "Rejected");
  });
}

async function handleStatusChange(id, newStatus) {
  const ref = doc(db, "applications", id);
  try {
    await updateDoc(ref, {
      status: newStatus,
      reviewedAt: Timestamp.now()
    });
    console.log(`✅ Status updated to ${newStatus} for ${id}`);
  } catch (err) {
    console.error("❌ Failed to update status:", err);
    alert("Update failed!");
  }
}
