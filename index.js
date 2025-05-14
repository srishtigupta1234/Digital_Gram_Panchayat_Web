import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

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

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');

// Form Toggle Function
window.switchTab = function(tab) {
  if (tab === 'login') {
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
  } else {
    registerForm.classList.add('active');
    loginForm.classList.remove('active');
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
  }
};

// Register Function
registerForm.addEventListener("submit", function(event){
  event.preventDefault();
  const name = document.getElementById("registerName").value;
  const village = document.getElementById("registerVillage").value;
  const userType = document.getElementById("registerUserType").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;

  createUserWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name,
        email,
        village,
        userType,
        createdAt: new Date()
      });
      alert("Registered Successfully!");
      switchTab('login');
    })
    .catch((error) => {
      alert(error.message);
    });
});

loginForm.addEventListener("submit", async function(event){
    event.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
  
    signInWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        const user = userCredential.user;
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
  
        if (docSnap.exists()) {
          const userData = docSnap.data();
          const userType = userData.userType;
  
          if (userType === "admin") {
            window.location.href = "admin.html";
          } else if (userType === "staff") {
            window.location.href = "employees.html";
          } else {
            window.location.href = "home.html";
          }
        } else {
          alert("User data not found in Firestore!");
        }
      })
      .catch((error) => {
        alert("Login Error: " + error.message);
      });
  });
  