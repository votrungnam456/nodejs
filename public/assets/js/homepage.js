document.addEventListener("DOMContentLoaded", () => {
  const checkAuth = async () => {
    try {
      const response = await fetch(API.USER.ME);
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
  };

  document.getElementById("logoutBtn").addEventListener("click", async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(API.AUTH.LOGOUT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        window.location.href = "/";
      }
    } catch (error) {
      // Logout error - continue
    }
  });

  // Check authentication on page load
  checkAuth();
});
