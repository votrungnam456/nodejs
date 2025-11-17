document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("changePasswordForm");
  const btn = document.getElementById("changeBtn");
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

    const currentPassword = document
      .getElementById("currentPassword")
      .value.trim();
    const newPassword = document.getElementById("newPassword").value.trim();
    const confirmPassword = document
      .getElementById("confirmPassword")
      .value.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      showMessage("Vui lòng điền đầy đủ thông tin", "error");
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

    setLoading(true);
    showMessage("", "");

    try {
      const res = await fetch(API.AUTH.CHANGE_PASSWORD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          showMessage("Mật khẩu hiện tại không đúng", "error");
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.status === 200) {
        showMessage("Đổi mật khẩu thành công", "success");
        setTimeout(() => {
          window.location.href = "/profile";
        }, 1200);
      } else {
        showMessage(data.message || "Có lỗi xảy ra", "error");
      }
    } catch (err) {
      showMessage("Không thể đổi mật khẩu. Vui lòng thử lại.", "error");
    } finally {
      setLoading(false);
    }
  });
});
