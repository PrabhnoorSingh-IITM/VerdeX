import { auth, db } from "../firebase/firebase.js";
import { onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, addDoc, serverTimestamp } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { showToast } from "../utils/toast.js";

// DOM elements
const reportForm = document.getElementById("reportForm");
const imageInput = document.getElementById("images");
const imageUploadLabel = document.getElementById("imageUploadLabel");
const imagePreview = document.getElementById("imagePreview");

// Store uploaded images
let uploadedImages = [];

// Image upload handling
imageUploadLabel.addEventListener("click", () => {
  imageInput.click();
});

imageInput.addEventListener("change", (e) => {
  handleImageUpload(e.target.files);
});

function handleImageUpload(files) {
  Array.from(files).forEach(file => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const imageData = {
          file: file,
          url: e.target.result,
          name: file.name
        };
        uploadedImages.push(imageData);
        displayImagePreview(imageData, uploadedImages.length - 1);
      };
      
      reader.readAsDataURL(file);
    }
  });
  
  updateUploadLabel();
}

function displayImagePreview(imageData, index) {
  const previewItem = document.createElement("div");
  previewItem.className = "image-preview-item";
  previewItem.innerHTML = `
    <img src="${imageData.url}" alt="${imageData.name}">
    <button type="button" class="remove-image" data-index="${index}">×</button>
  `;
  
  imagePreview.appendChild(previewItem);
  
  // Add remove functionality
  previewItem.querySelector(".remove-image").addEventListener("click", (e) => {
    e.preventDefault();
    removeImage(index);
  });
}

function removeImage(index) {
  uploadedImages.splice(index, 1);
  refreshImagePreview();
  updateUploadLabel();
}

function refreshImagePreview() {
  imagePreview.innerHTML = "";
  uploadedImages.forEach((imageData, index) => {
    displayImagePreview(imageData, index);
  });
}

function updateUploadLabel() {
  if (uploadedImages.length > 0) {
    imageUploadLabel.querySelector(".upload-text").textContent = 
      `${uploadedImages.length} image${uploadedImages.length > 1 ? 's' : ''} selected`;
    imageUploadLabel.querySelector(".upload-hint").textContent = "Click to add more images";
  } else {
    imageUploadLabel.querySelector(".upload-text").textContent = "Click to add images";
    imageUploadLabel.querySelector(".upload-hint").textContent = "You can select multiple images";
  }
}

// Check authentication and initialize
onAuthStateChanged(auth, (user) => {
  if (!user) {
    // Redirect to login if not authenticated
    window.location.href = "login.html";
    return;
  }
});

// Form submission handler
reportForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const submitBtn = reportForm.querySelector(".submit-btn");
  const originalText = submitBtn.textContent;
  
  try {
    // Disable submit button and show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";
    
    // Get form data
    const issueType = document.getElementById("issueType").value;
    const location = document.getElementById("location").value;
    const description = document.getElementById("description").value;
    const urgency = document.querySelector('input[name="urgency"]:checked')?.value;
    
    // Validate form
    if (!issueType || !location || !description || !urgency) {
      showToast("Please fill in all fields", "error");
      return;
    }
    
    // Get current user info
    const user = auth.currentUser;
    if (!user) {
      showToast("Please login to submit a report", "error");
      return;
    }
    
    // Create report document
    const reportData = {
      userId: user.uid,
      userEmail: user.email,
      issueType,
      location,
      description,
      urgency,
      status: "open",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      campusId: localStorage.getItem("campusId") || "",
      imageCount: uploadedImages.length,
      hasImages: uploadedImages.length > 0
    };
    
    // Add to Firestore
    const docRef = await addDoc(collection(db, "reports"), reportData);
    
    console.log("Report submitted with ID:", docRef.id);
    
    // TODO: Upload images to storage (for now, we'll just log them)
    if (uploadedImages.length > 0) {
      console.log("Images to upload:", uploadedImages.map(img => img.name));
      // In a real implementation, you would upload these to Firebase Storage
      // and save the URLs in the document
    }
    
    // Show success message
    showToast("Report submitted successfully!", "success");
    
    // Reset form
    reportForm.reset();
    uploadedImages = [];
    imagePreview.innerHTML = "";
    updateUploadLabel();
    
    // Redirect to dashboard after a short delay
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1500);
    
  } catch (error) {
    console.error("Error submitting report:", error);
    showToast("Failed to submit report. Please try again.", "error");
  } finally {
    // Re-enable submit button
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});

// Add input validation feedback
document.getElementById("location").addEventListener("input", (e) => {
  const value = e.target.value;
  if (value.length < 3) {
    e.target.setCustomValidity("Location must be at least 3 characters");
  } else {
    e.target.setCustomValidity("");
  }
});

document.getElementById("description").addEventListener("input", (e) => {
  const value = e.target.value;
  if (value.length < 10) {
    e.target.setCustomValidity("Description must be at least 10 characters");
  } else {
    e.target.setCustomValidity("");
  }
});