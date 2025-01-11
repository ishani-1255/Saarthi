// Setup chart data
const quizData = {
    labels: ['Quiz 1', 'Quiz 2', 'Quiz 3', 'Quiz 4', 'Quiz 5'],
    datasets: [{
      label: 'Quiz Progress',
      data: [80, 90, 70, 85, 95],
      backgroundColor: '#6C63FF',
      borderColor: '#4F4CDB',
      borderWidth: 1,
      tension: 0.4
    }]
  };
  
  const taskData = {
    labels: ['Task 1', 'Task 2', 'Task 3', 'Task 4', 'Task 5'],
    datasets: [{
      label: 'Tasks Completed',
      data: [3, 4, 5, 4, 5],
      backgroundColor: '#FF7A8C',
      borderColor: '#FF3E6C',
      borderWidth: 1,
      tension: 0.4
    }]
  };
  
  // Create charts
  const ctxQuiz = document.getElementById('quizProgress').getContext('2d');
  const quizChart = new Chart(ctxQuiz, {
    type: 'line',
    data: quizData,
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
      },
      scales: {
        x: {
          beginAtZero: true,
        },
        y: {
          min: 0,
          max: 100
        }
      }
    }
  });
  
  const ctxTask = document.getElementById('taskProgress').getContext('2d');
  const taskChart = new Chart(ctxTask, {
    type: 'bar',
    data: taskData,
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
      },
      scales: {
        x: {
          beginAtZero: true,
        },
        y: {
          min: 0,
          max: 5
        }
      }
    }
  });
  
  // Update Progress Button
  document.getElementById('updateProgress').addEventListener('click', () => {
    // Simulate dynamic data update
    quizChart.data.datasets[0].data = [85, 88, 75, 90, 98];
    taskChart.data.datasets[0].data = [4, 4, 5, 5, 5];
  
    quizChart.update();
    taskChart.update();
  });
  