document.querySelector('.sign-in-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    let isValid = true;

    if (!validateEmail(email)) {
        showError('loginEmail', 'loginEmailError', 'Please enter a valid email address');
        isValid = false;
    } else {
        hideError('loginEmailError');
    }

    if (password.length < 6) {
        showError('loginPassword', 'loginPasswordError', 'Password must be at least 6 characters');
        isValid = false;
    } else {
        hideError('loginPasswordError');
    }

    if (isValid) {
        console.log('Login successful');
        window.location.href = "index.html";
    }
});