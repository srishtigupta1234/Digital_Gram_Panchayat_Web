import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAdLXqE3DZXH9R0TWAMSBdpUWGO9KmjU1U",
  authDomain: "basic-272bd.firebaseapp.com",
  projectId: "basic-272bd",
  storageBucket: "basic-272bd.appspot.com",
  messagingSenderId: "382607868032",
  appId: "1:382607868032:web:1271dea9c63fcb23c72665",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const servicesList = document.getElementById("servicesList");
const appliedContainer = document.getElementById("appliedServicesList");
const welcomeMessage = document.getElementById("welcomeMessage");
const searchInput = document.getElementById("searchInput");
const welcomeText = document.getElementById("nonauthUser");
const heroBtn = document.getElementsByClassName("hero-btn")[0];

let allServices = []; // Store all fetched services for search filtering

// Load all available services
async function loadServices() {
  try {
    const querySnapshot = await getDocs(collection(db, "services"));
    allServices = []; // Clear previous
    querySnapshot.forEach((doc) => {
      const service = { id: doc.id, ...doc.data() };
      allServices.push(service);
    });

    displayServices(allServices);
  } catch (error) {
    console.error("Error loading services:", error);
  }
}

// Display services
function displayServices(services) {
  servicesList.innerHTML = ""; // Clear previous

  services.forEach((service) => {
    const serviceCard = document.createElement("div");
    serviceCard.classList.add("service-card");
    serviceCard.innerHTML = `
      <h3>${service.serviceName}</h3>
      <p><strong>Description:</strong> ${service.description || "N/A"}</p>
      <p><strong>Eligibility:</strong> ${service.eligibility || "N/A"}</p>
      <p><strong>Required Documents:</strong> ${service.documents || "N/A"}</p>
      <p><strong>Fees:</strong> ${service.fees || "N/A"}</p>
      <a href="register.html" class="action-btn">Register for this Service</a>
    `;
    servicesList.appendChild(serviceCard);
  });
}

// Load user-specific applications
async function loadUserApplications(userId) {
  appliedContainer.innerHTML = "";

  const q = query(collection(db, "applications"), where("uid", "==", userId));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    appliedContainer.innerHTML =
      "<p>You haven't applied for any services yet.</p>";
    return;
  }

  const seen = new Set();
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (seen.has(data.serviceId)) return;
    seen.add(data.serviceId);

    const appCard = document.createElement("div");
    appCard.classList.add("service-card", "applied-card");
    appCard.innerHTML = `
      <h3>${data.serviceName}</h3>
      <p><strong>Name:</strong> ${data.fullName}</p>
      <p><strong>Date of Birth:</strong> ${data.dob}</p>
      <p><strong>Status:</strong> 
        <span class="status ${data.status.toLowerCase()}">${data.status}</span>
      </p>
    `;
    appliedContainer.appendChild(appCard);
  });
}

// Search functionality
searchInput.addEventListener("input", () => {
  const term = searchInput.value.toLowerCase().trim();
  const filteredServices = allServices.filter((service) =>
    service.serviceName.toLowerCase().includes(term)
  );
  displayServices(filteredServices);
});

// Auth controls
document.getElementById("logoutLink").addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      alert("Logged out successfully!");
      window.location.href = "home.html";
    })
    .catch((error) => {
      console.error("Logout failed: ", error);
    });
});

// Auth state monitoring
onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById("loginLink").style.display = "none";
    document.getElementById("registerLink").style.display = "none";
    document.getElementById("homeLink").style.display = "none";
    document.getElementById("logoutLink").style.display = "inline-block";
    document.getElementById("appliedServicesSection").style.display = "block";
    // Change the "Get Started" button to go to dashboard or home
    heroBtn.setAttribute("href", "home.html");

    // Show logged-in messages
    welcomeText.style.display = "block";
    welcomeText.textContent = `Welcome back! You’re already logged in. Explore and manage your services below.`;

    welcomeMessage.style.display = "block";
    welcomeMessage.textContent = `Hello, ${user.email}!`;

    loadUserApplications(user.uid);
  } else {
    document.getElementById("loginLink").style.display = "inline-block";
    document.getElementById("registerLink").style.display = "inline-block";
    document.getElementById("homeLink").style.display = "inline-block";
    document.getElementById("logoutLink").style.display = "none";
    document.getElementById("appliedServicesSection").style.display = "none";
    document.getElementById("nonauthUser").style.display = "inline-block";
    welcomeMessage.style.display = "block";
    welcomeMessage.textContent =
      "Welcome! Please log in to view and register for services.";
  }
});

// Draggable CTA
const cta = document.getElementById("draggableCta");
let isDragging = false;
let offset = { x: 0, y: 0 };

cta.addEventListener("mousedown", (e) => {
  isDragging = true;
  offset.x = e.clientX - cta.getBoundingClientRect().left;
  offset.y = e.clientY - cta.getBoundingClientRect().top;
  cta.style.cursor = "grabbing";
});

document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  cta.style.left = `${e.clientX - offset.x}px`;
  cta.style.top = `${e.clientY - offset.y}px`;
  cta.style.bottom = "auto";
  cta.style.right = "auto";
  cta.style.position = "fixed";
});

document.addEventListener("mouseup", () => {
  isDragging = false;
  cta.style.cursor = "grab";
});

cta.addEventListener("click", () => {
  const servicesSection = document.getElementById("servicesList");
  servicesSection?.scrollIntoView({ behavior: "smooth" });
});

// Initial load
loadServices();
