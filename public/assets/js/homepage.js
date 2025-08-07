document.addEventListener("DOMContentLoaded", function () {
  // Check authentication and load user data
  async function checkAuth() {
    try {
      const response = await fetch("/api/user/me");
      if (response.ok) {
        const data = await response.json();
        if (data.status === 200) {
          // User is authenticated, show user info
          document.getElementById("userName").textContent =
            data.user.firstName + " " + data.user.lastName;
          document.getElementById("userEmail").textContent = data.user.email;
          document.getElementById("userInfo").style.display = "block";
        }
      } else {
        // User not authenticated, redirect to login
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      window.location.href = "/";
    }
  }

  // Logout functionality
  document
    .getElementById("logoutBtn")
    .addEventListener("click", async function (e) {
      e.preventDefault();

      try {
        const response = await fetch("/api/user/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          // Redirect to login page after logout
          window.location.href = "/";
        } else {
          console.error("Logout failed");
        }
      } catch (error) {
        console.error("Logout error:", error);
      }
    });

  // Check authentication on page load
  checkAuth();
});
