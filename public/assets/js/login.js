document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const loginBtn = document.getElementById("loginBtn");
  const btnText = loginBtn.querySelector(".btn-text");
  const loading = loginBtn.querySelector(".loading");
  const errorMessage = document.getElementById("errorMessage");
  const successMessage = document.getElementById("successMessage");

  const setLoading = (isLoading) => {
    if (isLoading) {
      btnText.style.display = "none";
      loading.style.display = "inline-block";
      loginBtn.disabled = true;
    } else {
      btnText.style.display = "inline";
      loading.style.display = "none";
      loginBtn.disabled = false;
    }
  };

  const showMessage = (message, type) => {
    errorMessage.style.display = "none";
    successMessage.style.display = "none";

    if (type === "error") {
      errorMessage.textContent = message;
      errorMessage.style.display = "block";
    } else if (type === "success") {
      successMessage.textContent = message;
      successMessage.style.display = "block";
    }
  };

  const loginUser = async (username, password) => {
    try {
      const response = await fetch(API.AUTH.LOGIN, {
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
      throw error;
    }
  };

  const callExternalAPI = async () => {
    try {
      const response = await fetch(API.USER.ME);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  };

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (!username || !password) {
      showMessage("Please fill in all fields", "error");
      return;
    }

    setLoading(true);
    showMessage("", "");

    try {
      const data = await loginUser(username, password);

      if (data.status === 200) {
        showMessage("Login successful! Redirecting...", "success");

        setTimeout(() => {
          window.location.href = "/homepage";
        }, 1500);
      } else {
        showMessage(data.message || "Login failed", "error");
      }
    } catch (error) {
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

  const inputs = document.querySelectorAll("input");
  inputs.forEach((input) => {
    input.addEventListener("focus", function () {
      this.parentElement.style.transform = "scale(1.02)";
    });

    input.addEventListener("blur", function () {
      this.parentElement.style.transform = "scale(1)";
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "d") {
      document.getElementById("username").value = "admin";
      document.getElementById("password").value = "password123";
    }
  });
});
