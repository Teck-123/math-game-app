const API_BASE = "http://localhost:3000"
document.addEventListener('DOMContentLoaded', () => {

const startBtn = document.getElementById("start-btn");
const playerNameInput = document.getElementById("players-name");
const levelSelect = document.getElementById("level");
const quizArea = document.getElementById("quiz-area");
const scoreDisplay = document.getElementById("score");
const leaderbody = document.getElementById("leader-body");
const rewardDisplay = document.getElementById("reward-display");
const feedback = document.getElementById("feedback");

let questions = []
let currentScore = 0;
let currentIndex = 0;
let playerName = "";
let currentQuestion = [];

startBtn.addEventListener("click", startQuiz);

//Fetch questions

async function loadQuestions() {
  try{
        const response = await 
        fetch('http://localhost:3000/questions');
        questions = await response.json();
        console.log('Question loaded:', questions.length)
    }
    catch (error) {quizArea.innerHTML = 'Error loading questions!'; console.error(error)};
  }

   
//Start quiz

function startQuiz() {
    playerName = playerNameInput.value.trim();
    if (!playerName) {
        alert('Please enter yur name to start the quiz!');
        return;
    }
    const selectedLevel = levelSelect.value;
    currentScore = 0;
    currentIndex = 0;
    scoreDisplay.textContent = "score: ${currentScore}";
    rewardDisplay.textContent = "";
       
    //Filter questions by level

    currentQuestion = questions.filter(question => question.level === selectedLevel);
    filteredQuestions = questions.filter(question => question.level === selectedLevel);
    console.log('Questions filtered for the level ${selectedLevel}', currentQuestion)
    shuffleArray(currentQuestion);
    showQuestion();
}

//Show a question
function showQuestion() {
    if (currentIndex >= currentQuestion.length) {
        finishQuiz();
        return;
    }
       const q = currentQuestion[currentIndex];
    quizArea.innerHTML = `
      <p>Question ${currentIndex + 1}: ${q.question}</p>
      <input type="number" id="answer-input" placeholder="Your Answer" />
      <button id="submit-answer">Submit Answer</button>
    `;
  document.getElementById("submit-answer").addEventListener("click", submitAnswer);
}



//Submit answer

function submitAnswer() {
  const userAnswer = parseFloat(document.getElementById("answer-input").value);

  if (isNaN(userAnswer)) {
    updateFeedback("Please enter a valid number.");
    return;
  }

  const correctAnswer = currentQuestion[currentIndex].answer;

  if (userAnswer === correctAnswer) {
    updateFeedback("Correct!", "green");
    currentScore++;
  } else {
    updateFeedback(`Wrong! The correct answer was ${correctAnswer}`, "red");
  }

 scoreDisplay.textContent = `Score: ${currentScore}`;
  currentIndex++;

  if (currentIndex < currentQuestion.length) {
    showQuestion();
  } else {
    finishQuiz();
  }
}

//Feedback

function updateFeedback(message, color) {
  const feedback = document.getElementById("feedback");
  feedback.textContent = message;
  feedback.style.color = color;
}



//After quiz is done

async function finishQuiz() {
    quizArea.innerHTML = `<p>Quiz completed! Your final score is ${currentScore}.</p>`;
    await postScore();
    displayRewards();
    loadLeaderboard();
}

//Shuffle question array

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}


//Display reward

function displayRewards() {
    if (currentScore >= 10) {
        rewardDisplay.textContent = 'Excellent! You earned a Gold medal!';
    }
    else if (currentScore >= 5) {
        rewardDisplay.textContent = 'Great job! You earned a Silver medal!';
    }
    else if (currentScore > 0) {
        rewardDisplay.textContent = 'Good effort! You earned a Bronze medal!'
    }
    else {
        rewardDisplay.textContent = 'Keep practising to earm rewards!'
    }
}

//POST

async function postScore() {
    try {
        //check if player alreadt exists

        const existingResponse = await fetch (`http://localhost:3000/leaderboard?name=${encodeURIComponent(playerName)}`);
        const existingData = await existingResponse.json();

        if(existingData.length > 0) {
            const playerEntry = existingData[0];
            if (currentScore > playerEntry.score) {
                await patchScore("playerEntry.id", currentScore);
            }
            else {
                //New player
               const response = await fetch (`http://localhost:3000/leaderboard`, {
                    method: "POST",
                    headers: {"Content-Type":"application/json"},
                    body: JSON.stringify({name: playerName, score: currentScore})
                });
            }
            loadLeaderboard();
        }
    }
    catch (error) { console.error("Error posting score:", error)};
}

//PATCH

async function patchScore(id, newScore) {
    try{
        await fetch(`http://localhost:3000/leaderboard/${id}`, {
            method: 'PATCH',
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({score: newScore})
        });
    }
    catch (error) { console.error("Error updating score:", error)};
}

//Load leaderboard

let leaderboardLoading = false;

async function loadLeaderboard() {
  if (leaderboardLoading) return;
  leaderboardLoading = true;

    try {
        const response = await 
        fetch (`http://localhost:3000/leaderboard`);
        if (!response.ok) throw new Error('Failed to load leaderboard');
        const leaderboard = await response.json();
        displayLeaderboard(leaderboard);
    }
    catch (error) { console.error("Error loading leaderboard")}
    finally {leaderboardLoading = false}
}

function displayLeaderboard(data) {
  console.log("Displaying leaderboard with", data.length, 'entries');
}

//Display leaderboard table rows

function displayLeaderboard(data) {
    if (!data.length) {
        leaderbody.innerHTML =  '<tr><td colspan="3">No entries yet</td></tr>';
        return;
    }
    data.sort((a, b) => b.score - a.score);
    leaderbody.innerHTML = data.map((entry, index) => `<tr>
      <td>${index + 1}</td>
      <td>${entry.name}</td>
      <td>${entry.score}</td>
    </tr>`
  ).join('');
}

loadQuestions();
});
