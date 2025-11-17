document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("forgotPasswordForm");
  const btn = document.getElementById("forgotBtn");
  const btnText = btn.querySelector(".btn-text");
  const loading = btn.querySelector(".loading");
  const errorMessage = document.getElementById("errorMessage");
  const successMessage = document.getElementById("successMessage");

  const setLoading = (isLoading) => {
    if (isLoading) {
      btnText.style.display = "none";
      loading.style.display = "inline-block";
      btn.disabled = true;
    } else {
      btnText.style.display = "inline";
      loading.style.display = "none";
      btn.disabled = false;
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

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const username = document.getElementById("username").value.trim();

    if (!email && !username) {
      showMessage("Nhập email hoặc tên đăng nhập", "error");
      return;
    }

    setLoading(true);
    showMessage("", "");

    try {
      const res = await fetch(API.AUTH.FORGOT_PASSWORD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email || undefined,
          username: username || undefined,
        }),
      });

      // Even if user not found, server returns 200 for security
      const data = await res.json();
      if (res.ok) {
        // For demo: show token if provided
        const extra = data.resetToken
          ? `\nToken (demo): ${data.resetToken}`
          : "";
        showMessage(
          (data.message || "Đã tạo liên kết đặt lại") + extra,
          "success"
        );
      } else {
        showMessage(data.message || "Có lỗi xảy ra", "error");
      }
    } catch (err) {
      showMessage("Không thể gửi yêu cầu. Vui lòng thử lại.", "error");
    } finally {
      setLoading(false);
    }
  });
});
