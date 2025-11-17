document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("resetPasswordForm");
  const btn = document.getElementById("resetBtn");
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

    const newPassword = document.getElementById("newPassword").value.trim();
    const confirmPassword = document
      .getElementById("confirmPassword")
      .value.trim();
    const token =
      window.__RESET_TOKEN__ ||
      new URLSearchParams(window.location.search).get("token") ||
      "";

    if (!newPassword || !confirmPassword) {
      showMessage("Vui lòng nhập đầy đủ thông tin", "error");
      return;
    }
    if (newPassword.length < 6) {
      showMessage("Mật khẩu mới tối thiểu 6 ký tự", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showMessage("Xác nhận mật khẩu không khớp", "error");
      return;
    }
    if (!token) {
      showMessage("Thiếu token đặt lại mật khẩu", "error");
      return;
    }

    setLoading(true);
    showMessage("", "");

    try {
      const res = await fetch(API.AUTH.RESET_PASSWORD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        showMessage(
          data.message || "Liên kết không hợp lệ hoặc đã hết hạn",
          "error"
        );
        return;
      }
      showMessage(
        "Đặt lại mật khẩu thành công. Vui lòng đăng nhập.",
        "success"
      );
      setTimeout(() => {
        window.location.href = "/";
      }, 1200);
    } catch (err) {
      showMessage("Không thể đặt lại mật khẩu. Vui lòng thử lại.", "error");
    } finally {
      setLoading(false);
    }
  });
});
