import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Firebase Configuration
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
const db = getFirestore(app);

// Handle form submission
document.getElementById("createServiceForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const serviceName = document.getElementById("name").value;
  const description = document.getElementById("description").value;
  const department = document.getElementById("department").value;
  const eligibility = document.getElementById("eligibility").value;
  const documents = document.getElementById("documents").value.split(",").map(doc => doc.trim());
  const fees = document.getElementById("fee").value;
  const questions = document.getElementById("questions").value.split(",").map(q => q.trim());

  const schemeData = {
    serviceName,
    description,
    department,
    eligibility,
    documents,
    fees,
    questions,
    createdAt: new Date()
  };

  try {
    await addDoc(collection(db, "services"), schemeData);
    alert("Service created successfully!");
    window.location.href = "admin.html";
  } catch (error) {
    console.error("Error creating service: ", error);
    alert("Failed to create service.");
  }
});
