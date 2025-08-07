document.addEventListener("DOMContentLoaded", function () {
  const profileForm = document.getElementById("profileForm");
  const updateBtn = document.getElementById("updateBtn");
  const btnText = updateBtn.querySelector(".btn-text");
  const loading = updateBtn.querySelector(".loading");
  const errorMessage = document.getElementById("errorMessage");
  const successMessage = document.getElementById("successMessage");
  const logoutBtn = document.getElementById("logoutBtn");

  // Function to show/hide loading state
  function setLoading(isLoading) {
    if (isLoading) {
      btnText.style.display = "none";
      loading.style.display = "inline-block";
      updateBtn.disabled = true;
    } else {
      btnText.style.display = "inline";
      loading.style.display = "none";
      updateBtn.disabled = false;
    }
  }

  // Function to show messages
  function showMessage(message, type) {
    errorMessage.style.display = "none";
    successMessage.style.display = "none";

    if (type === "error") {
      errorMessage.textContent = message;
      errorMessage.style.display = "block";
    } else if (type === "success") {
      successMessage.textContent = message;
      successMessage.style.display = "block";
    }
  }

  // Function to get current user data
  async function getCurrentUser() {
    try {
      const response = await fetch("/api/user/me", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Get user error:", error);
      throw error;
    }
  }

  // Function to update user profile
  async function updateProfile(firstName, lastName, email) {
    try {
      const response = await fetch("/api/user/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: firstName,
          lastName: lastName,
          email: email,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    }
  }

  // Function to logout
  async function logout() {
    try {
      const response = await fetch("/api/user/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  // Load user data on page load
  async function loadUserData() {
    try {
      const data = await getCurrentUser();
      if (data.status === 200) {
        document.getElementById("username").value = data.user.username;
        document.getElementById("firstName").value = data.user.firstName;
        document.getElementById("lastName").value = data.user.lastName;
        document.getElementById("email").value = data.user.email;
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
      showMessage("Failed to load user data. Please try again.", "error");
    }
  }

  // Handle form submission
  profileForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const firstName = document.getElementById("firstName").value;
    const lastName = document.getElementById("lastName").value;
    const email = document.getElementById("email").value;

    // Basic validation
    if (!firstName || !lastName || !email) {
      showMessage("Please fill in all fields", "error");
      return;
    }

    setLoading(true);
    showMessage("", "");

    try {
      const data = await updateProfile(firstName, lastName, email);
      console.log("Update response:", data);

      if (data.status === 200) {
        showMessage("Profile updated successfully!", "success");
      } else {
        showMessage(data.message || "Update failed", "error");
      }
    } catch (error) {
      console.error("Update error:", error);
      if (error.message.includes("HTTP error! status: 409")) {
        showMessage("Email already exists", "error");
      } else if (error.message.includes("HTTP error! status: 400")) {
        showMessage("Please fill in all fields", "error");
      } else {
        showMessage("Update failed. Please try again.", "error");
      }
    } finally {
      setLoading(false);
    }
  });

  // Handle logout
  logoutBtn.addEventListener("click", function () {
    logout();
  });

  // Add some interactive features
  const inputs = document.querySelectorAll("input:not([disabled])");
  inputs.forEach((input) => {
    input.addEventListener("focus", function () {
      this.parentElement.style.transform = "scale(1.02)";
    });

    input.addEventListener("blur", function () {
      this.parentElement.style.transform = "scale(1)";
    });
  });

  // Load user data when page loads
  loadUserData();
});
