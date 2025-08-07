document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const loginBtn = document.getElementById("loginBtn");
  const btnText = loginBtn.querySelector(".btn-text");
  const loading = loginBtn.querySelector(".loading");
  const errorMessage = document.getElementById("errorMessage");
  const successMessage = document.getElementById("successMessage");

  // Function to show/hide loading state
  function setLoading(isLoading) {
    if (isLoading) {
      btnText.style.display = "none";
      loading.style.display = "inline-block";
      loginBtn.disabled = true;
    } else {
      btnText.style.display = "inline";
      loading.style.display = "none";
      loginBtn.disabled = false;
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

  // Function to call API
  async function loginUser(username, password) {
    try {
      // Simulate API call - replace with your actual API endpoint
      const response = await fetch("/api/user/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  // Function to call external API (JSONPlaceholder as example)
  async function callExternalAPI() {
    try {
      const response = await fetch("/api/user");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("External API data:", data);
      return data;
    } catch (error) {
      console.error("External API error:", error);
      throw error;
    }
  }

  // Handle form submission
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    // Basic validation
    if (!username || !password) {
      showMessage("Please fill in all fields", "error");
      return;
    }

    setLoading(true);
    showMessage("", "");

    try {
      const data = await loginUser(username, password);
      console.log("Login response:", data);

      if (data.status === 200) {
        showMessage("Login successful! Redirecting...", "success");

        // Redirect to homepage after successful login
        setTimeout(() => {
          window.location.href = "/homepage";
        }, 1500);
      } else {
        showMessage(data.message || "Login failed", "error");
      }
    } catch (error) {
      console.error("Login error:", error);
      if (error.message.includes("HTTP error! status: 401")) {
        showMessage("Invalid username or password", "error");
      } else if (error.message.includes("HTTP error! status: 400")) {
        showMessage("Please fill in all fields", "error");
      } else {
        showMessage("Login failed. Please try again.", "error");
      }
    } finally {
      setLoading(false);
    }
  });

  // Add some interactive features
  const inputs = document.querySelectorAll("input");
  inputs.forEach((input) => {
    input.addEventListener("focus", function () {
      this.parentElement.style.transform = "scale(1.02)";
    });

    input.addEventListener("blur", function () {
      this.parentElement.style.transform = "scale(1)";
    });
  });

  // Auto-fill demo credentials for testing
  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey && e.key === "d") {
      document.getElementById("username").value = "admin";
      document.getElementById("password").value = "password123";
    }
  });
});
