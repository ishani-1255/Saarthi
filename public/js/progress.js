// Handling form submission
document.getElementById('feedbackForm').addEventListener('submit', function(event) {
    event.preventDefault();
  
    // Get form data
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const rating = document.getElementById('rating').value;
    const comments = document.getElementById('comments').value;
  
    // Log feedback data (in a real app, this could be sent to a backend API)
    console.log('Feedback Submitted:', {
      name,
      email,
      rating,
      comments
    });
  
    // Hide the feedback form and show the thank-you message
    document.querySelector('.feedback-form').style.display = 'none';
    document.querySelector('.thank-you-message').style.display = 'block';
  });
  