document.addEventListener('DOMContentLoaded', function () {
  const signupForm = document.getElementById('signupForm');
  const signupBtn = document.getElementById('signupBtn');
  const btnText = signupBtn.querySelector('.btn-text');
  const loading = signupBtn.querySelector('.loading');
  const errorMessage = document.getElementById('errorMessage');
  const successMessage = document.getElementById('successMessage');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const passwordStrength = document.getElementById('passwordStrength');

  // Function to show/hide loading state
  function setLoading(isLoading) {
    if (isLoading) {
      btnText.style.display = 'none';
      loading.style.display = 'inline-block';
      signupBtn.disabled = true;
    } else {
      btnText.style.display = 'inline';
      loading.style.display = 'none';
      signupBtn.disabled = false;
    }
  }

  // Function to show messages
  function showMessage(message, type) {
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';

    if (type === 'error') {
      errorMessage.textContent = message;
      errorMessage.style.display = 'block';
    } else if (type === 'success') {
      successMessage.textContent = message;
      successMessage.style.display = 'block';
    }
  }

  // Function to check password strength
  function checkPasswordStrength(password) {
    let strength = 0;
    let feedback = '';

    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength < 3) {
      feedback = 'Weak password';
      passwordStrength.className = 'password-strength strength-weak';
    } else if (strength < 5) {
      feedback = 'Medium strength password';
      passwordStrength.className = 'password-strength strength-medium';
    } else {
      feedback = 'Strong password';
      passwordStrength.className = 'password-strength strength-strong';
    }

    passwordStrength.textContent = feedback;
  }

  // Function to validate form
  function validateForm() {
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!firstName || !lastName || !email || !username || !password || !confirmPassword) {
      showMessage('Please fill in all fields', 'error');
      return false;
    }

    if (password !== confirmPassword) {
      showMessage('Passwords do not match', 'error');
      return false;
    }

    if (password.length < 8) {
      showMessage('Password must be at least 8 characters long', 'error');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showMessage('Please enter a valid email address', 'error');
      return false;
    }

    return true;
  }

  // Function to call signup API
  async function signupUser(userData) {
    try {
      const response = await fetch('/api/user/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  // Handle form submission
  signupForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const userData = {
      firstName: document.getElementById('firstName').value.trim(),
      lastName: document.getElementById('lastName').value.trim(),
      email: document.getElementById('email').value.trim(),
      username: document.getElementById('username').value.trim(),
      password: passwordInput.value
    };

    setLoading(true);
    showMessage('', '');

    try {
      const data = await signupUser(userData);
      console.log('Signup response:', data);

      if (data.status === 201) {
        showMessage('Account created successfully! Redirecting to login...', 'success');

        // Redirect to login page after 2 seconds
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        showMessage(data.message || 'Signup failed', 'error');
      }
    } catch (error) {
      console.error('Signup error:', error);
      if (error.message.includes('HTTP error! status: 409')) {
        showMessage('Username or email already exists', 'error');
      } else if (error.message.includes('HTTP error! status: 400')) {
        showMessage('Please check your input and try again', 'error');
      } else {
        showMessage('Signup failed. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  });

  // Password strength checker
  passwordInput.addEventListener('input', function () {
    checkPasswordStrength(this.value);
  });

  // Add interactive features
  const inputs = document.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('focus', function () {
      this.parentElement.style.transform = 'scale(1.02)';
    });

    input.addEventListener('blur', function () {
      this.parentElement.style.transform = 'scale(1)';
    });
  });
});

// Function to toggle password visibility
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const button = input.nextElementSibling;

  if (input.type === 'password') {
    input.type = 'text';
    button.textContent = 'Hide';
  } else {
    input.type = 'password';
    button.textContent = 'Show';
  }
} 