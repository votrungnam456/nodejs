// Helper function to get default error messages
function getErrorMessage(status) {
  const messages = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Page Not Found',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout'
  };
  return messages[status] || 'Unknown Error';
}

// Add some interactive features
document.addEventListener('DOMContentLoaded', function () {
  // Add click to copy error details
  const errorDetails = document.querySelector('.error-details');
  if (errorDetails) {
    errorDetails.style.cursor = 'pointer';
    errorDetails.title = 'Click to copy error details';
    errorDetails.addEventListener('click', function () {
      const text = this.textContent.replace('Error Details:', '').trim();
      navigator.clipboard.writeText(text).then(() => {
        this.style.background = '#d4edda';
        setTimeout(() => {
          this.style.background = '#f8f9fa';
        }, 1000);
      });
    });
  }

  // Add keyboard shortcuts
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      history.back();
    } else if (e.key === 'Enter') {
      window.location.href = '/';
    }
  });
}); 