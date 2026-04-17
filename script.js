'use strict';
let apitoken = 'qa_sk_66ffe3024b359ee97192c6202573034e95ad2d88';

const question = document.querySelector('.ques');
const nextbtn = document.querySelector('.next');
const playAgainButton = document.querySelector('.play');
const progressBar = document.getElementById('progress');
const timerElement = document.getElementById('timer');
const timerContainer = document.querySelector('.timer-container');

const optionsContainer = document.querySelector('.options');
const startButton = document.querySelector('.startingButton');
const startingPage = document.querySelector('.starter');
const quizPage = document.querySelector('.app');

const highScoreDisplay = document.getElementById('high-score-display');
const clearHighScoreBtn = document.getElementById('clear-high-score-btn');

let data = [];
let currentQuestionNumber = 0;
let currentQuestion;
let correctAnswers = 0;

let type, number, diff, timeLimit;
let curl;

let isNewHighScore = false;
let timerInterval;
let remainingTime;
let timerRunning = false;

let highestScore = localStorage.getItem('highestScore') || 0;
updateHighScoreDisplays();

function updateHighScoreDisplays() {
    highScoreDisplay.textContent = highestScore;
}

function updateHighScore(score) {
    if (score > highestScore) {
        isNewHighScore = true;
        highestScore = score;
        localStorage.setItem('highestScore', highestScore);
        updateHighScoreDisplays();
        return true;
    }
    return false;
}

function updateProgress() {
    const progress = (currentQuestionNumber / data.length) * 100;
    progressBar.style.width = `${progress}%`;
}

clearHighScoreBtn.addEventListener('click', function () {
    clearHighScore();
    highScoreDisplay.classList.add('fade-in');
    setTimeout(() => {
        highScoreDisplay.classList.remove('fade-in');
    }, 500);
});

function clearHighScore() {
    localStorage.removeItem('highestScore');
    highestScore = 0;
    updateHighScoreDisplays();
}

function finalScreen() {
    isNewHighScore = updateHighScore(correctAnswers);
    stopTimer();

    const scorePercentage = Math.round((correctAnswers / data.length) * 100);
    let message;

    if (scorePercentage >= 90) message = "Outstanding! You're a master!";
    else if (scorePercentage >= 70) message = "Great job! Very impressive!";
    else if (scorePercentage >= 50) message = "Good effort! Keep learning!";
    else message = "Nice try! Practice makes perfect!";

    question.innerHTML = `
                <div class="final-score">
                    ${message}
                    <span class="score-highlight">${correctAnswers} / ${data.length}</span>
                    <div class="high-score-badge" ${isNewHighScore ? 'style="display:block"' : ''}>New High Score!</div>
                </div>
            `;

    optionsContainer.innerHTML = '';
    nextbtn.style.display = 'none';
    playAgainButton.style.display = 'block';
    timerContainer.style.display = 'none';
    progressBar.style.width = '100%';
}

function startTimer() {
    if (parseInt(timeLimit) === 0) {
        timerContainer.style.display = 'none';
        return;
    }

    timerContainer.style.display = 'flex';
    remainingTime = parseInt(timeLimit);
    timerElement.textContent = `Time: ${remainingTime}s`;
    timerElement.className = 'timer';
    timerRunning = true;

    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        remainingTime--;
        timerElement.textContent = `Time: ${remainingTime}s`;

        if (remainingTime <= 5) timerElement.className = 'timer danger';
        else if (remainingTime <= 10) timerElement.className = 'timer warning';

        if (remainingTime <= 0) {
            stopTimer();
            timeUp();
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    timerRunning = false;
}

function timeUp() {
    const allButtons = document.querySelectorAll('.btn');
    allButtons.forEach(btn => btn.disabled = true);

    allButtons.forEach(btn => {
        const answerKey = Object.keys(currentQuestion.answers).find(k => btn.textContent === currentQuestion.answers[k]);
        if (answerKey && currentQuestion.correct_answers[answerKey + '_correct'] === 'true') {
            btn.classList.add('correct');
        }
    });

    nextbtn.style.display = 'block';
}

function displayingData() {
    if (currentQuestionNumber >= data.length) {
        finalScreen();
        return;
    }

    currentQuestion = data[currentQuestionNumber];

    question.innerHTML = `${currentQuestionNumber + 1}. ${currentQuestion.question}`;
    currentQuestionNumber++;

    updateProgress();

    optionsContainer.innerHTML = '';
    nextbtn.style.display = 'none';
    playAgainButton.style.display = 'none';

    startTimer();

    for (const [key, value] of Object.entries(currentQuestion.answers)) {
        if (value) {
            const button = document.createElement('button');
            button.classList.add('btn');
            button.textContent = value;

            button.addEventListener('click', function () {
                stopTimer();

                const allButtons = document.querySelectorAll('.btn');
                allButtons.forEach(btn => btn.disabled = true);

                const selectedAnswerKey = Object.keys(currentQuestion.answers).find(k => currentQuestion.answers[k] === button.textContent);

                let correctKey = null;
                for (const k of Object.keys(currentQuestion.correct_answers)) {
                    if (currentQuestion.correct_answers[k] === 'true') {
                        correctKey = k.replace('_correct', '');
                        break;
                    }
                }

                if (selectedAnswerKey && correctKey && selectedAnswerKey === correctKey) {
                    button.classList.add('correct');
                    correctAnswers++;
                } else {
                    button.classList.add('incorrect');
                    allButtons.forEach(btn => {
                        const k = Object.keys(currentQuestion.answers).find(ansKey => currentQuestion.answers[ansKey] === btn.textContent);
                        if (k && currentQuestion.correct_answers[k + '_correct'] === 'true') {
                            btn.classList.add('correct');
                        }
                    });
                }

                nextbtn.style.display = 'block';
            });

            optionsContainer.appendChild(button);
        }
    }
}

nextbtn.addEventListener('click', function () {
    displayingData();
});

playAgainButton.addEventListener('click', function () {
    resetQuiz();
    displayingData();
});

function resetQuiz() {
    currentQuestionNumber = 0;
    correctAnswers = 0;
    isNewHighScore = false;
    progressBar.style.width = '0%';
    timerContainer.style.display = parseInt(timeLimit) === 0 ? 'none' : 'flex';
}

function getSelectedValue(name) {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : null;
}

function validateSelections() {
    type = getSelectedValue('a');
    number = getSelectedValue('numbers');
    diff = getSelectedValue('c');
    timeLimit = getSelectedValue('time');
    startButton.disabled = !(type && number && diff && timeLimit !== null);
}

document.querySelectorAll('input[type="radio"]').forEach(r => {
    r.addEventListener('change', validateSelections);
});

startButton.addEventListener('click', async function () {
    type = getSelectedValue('a');
    number = getSelectedValue('numbers');
    diff = getSelectedValue('c');
    timeLimit = getSelectedValue('time');

    curl = `https://quizapi.io/api/v1/questions?apiKey=${apitoken}&category=${encodeURIComponent(type)}&difficulty=${encodeURIComponent(diff.toLowerCase())}&limit=${number}`;

    startButton.disabled = true;
    startButton.textContent = "Loading...";

    try {
        const res = await fetch(curl);
        const json = await res.json();

        if (!Array.isArray(json) || json.length === 0) {
            startButton.disabled = false;
            startButton.textContent = "Start Quiz";
            alert("No questions found for this selection. Try another topic/difficulty.");
            return;
        }

        data = json;

        startingPage.style.display = 'none';
        quizPage.style.display = 'block';

        startButton.textContent = "Start Quiz";
        resetQuiz();
        displayingData();
    } catch (err) {
        startButton.disabled = false;
        startButton.textContent = "Start Quiz";
        alert("Error loading quiz. Check your internet/API key.");
    }
});

validateSelections();