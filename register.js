import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-storage.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAdLXqE3DZXH9R0TWAMSBdpUWGO9KmjU1U",
  authDomain: "basic-272bd.firebaseapp.com",
  projectId: "basic-272bd",
  storageBucket: "basic-272bd.appspot.com",
  messagingSenderId: "382607868032",
  appId: "1:382607868032:web:1271dea9c63fcb23c72665",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

let currentUser;

// Ensure user is logged in
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    await populateSchemes();
  } else {
    alert("You must be logged in to apply.");
    window.location.href = "login.html";
  }
});

// Populate the scheme dropdown
async function populateSchemes() {
  const schemeSelect = document.getElementById("schemeSelect");
  const snapshot = await getDocs(collection(db, "services"));
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const option = document.createElement("option");
    option.value = docSnap.id;
    option.textContent = data.serviceName;
    schemeSelect.appendChild(option);
  });
}

// On scheme change, build dynamic form fields
document.getElementById("schemeSelect").addEventListener("change", async function () {
  const selectedSchemeId = this.value;
  const formFields = document.getElementById("dynamicFields");
  formFields.innerHTML = "";

  if (!selectedSchemeId) return;

  const docSnap = await getDoc(doc(db, "services", selectedSchemeId));
  if (!docSnap.exists()) return;
  const data = docSnap.data();

  // Custom questions
  if (data.questions && Array.isArray(data.questions)) {
    formFields.appendChild(createHeading("Additional Questions"));
    data.questions.forEach((q, index) => {
      const type = q.trim().toLowerCase().startsWith("upload") ? "file" : "text";
      formFields.appendChild(createInput(q, `question_${index}`, type));
    });
  }

  // // Static document fields
  // if (data.documents && Array.isArray(data.documents)) {
  //   formFields.appendChild(document.createElement("hr"));
  //   formFields.appendChild(createHeading("Upload Documents"));
  //   data.documents.forEach((docName, index) => {
  //     formFields.appendChild(createInput(`${docName} (PDF/Image)`, `document_${index}`, "file"));
  //   });
  // }

  // Eligibility display
  if (data.eligibility && Array.isArray(data.eligibility)) {
    const eligBlock = document.createElement("div");
    eligBlock.innerHTML = `<h4>Eligibility Criteria</h4><ul>${
      data.eligibility.map((e) => `<li>${e}</li>`).join("")
    }</ul>`;
    formFields.appendChild(eligBlock);
  }
});

// Helpers
function createInput(labelText, name, type = "text") {
  const wrapper = document.createElement("div");
  wrapper.className = "form-group";
  const label = document.createElement("label");
  label.textContent = labelText;
  const input = document.createElement("input");
  input.name = name;
  input.id = name;
  input.type = type;
  if(type !== "file") input.required = true;
  wrapper.appendChild(label);
  wrapper.appendChild(input);
  return wrapper;
}
function createHeading(text) {
  const h4 = document.createElement("h4");
  h4.textContent = text;
  return h4;
}

// Handle submission with Storage upload
document.getElementById("schemeForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const schemeId = document.getElementById("schemeSelect").value;
  const serviceSnap = await getDoc(doc(db, "services", schemeId));
  if (!serviceSnap.exists()) {
    alert("Invalid scheme selected.");
    return;
  }
  const serviceData = serviceSnap.data();

  // Base application data
  const appData = {
    uid: currentUser.uid,
    email: currentUser.email,
    serviceId: schemeId,
    serviceName: serviceData.serviceName,
    fullName: document.getElementById("fullName")?.value || "",
    dob: document.getElementById("dob")?.value || "",
    address: document.getElementById("address")?.value || "",
    aadhar: document.getElementById("aadhar")?.value || "",
    status: "Pending",
    appliedAt: serverTimestamp(),
    answers: {},
    documents: []
  };

  // Collect text answers & file inputs
  const fileUploads = [];
  if (serviceData.questions) {
    serviceData.questions.forEach((q, i) => {
      const inputId = `question_${i}`;
      const el = document.getElementById(inputId);
      if (el) {
        if (el.type === "file" && el.files.length > 0) {
          fileUploads.push({ field: q, file: el.files[0], type: "answer" });
        } else {
          appData.answers[q] = el.value;
        }
      }
    });
  }
  if (serviceData.documents) {
    serviceData.documents.forEach((docName, i) => {
      const inputId = `document_${i}`;
      const el = document.getElementById(inputId);
      if (el && el.files.length > 0) {
        fileUploads.push({ field: docName, file: el.files[0], type: "document" });
      }
    });
  }

  try {
    // 1) Create Firestore doc
    const applicationsCol = collection(db, "applications");
    const docRef = await addDoc(applicationsCol, appData);

    // 2) Upload each file, collect URLs
    const uploads = await Promise.all(fileUploads.map(async ({ field, file, type }) => {
      const storageReference = storageRef(
        storage,
        `applications/${docRef.id}/${type}_${field.replace(/\s+/g, "_")}_${file.name}`
      );
      await uploadBytes(storageReference, file);
      const url = await getDownloadURL(storageReference);
      return { field, url, type };
    }));

    // 3) Merge URLs back into the document
    const updates = {};
    uploads.forEach(({ field, url, type }) => {
      if (type === "answer") {
        updates[`answers.${field}`] = url;
      } else {
        updates[`documents`] = appData.documents.concat({ name: field, url });
      }
    });
    await updateDoc(docRef, updates);

    alert("Application submitted successfully!");
    window.location.href = "home.html";

  } catch (error) {
    console.error("Submission error:", error);
    alert("Failed to submit application.");
  }
});
