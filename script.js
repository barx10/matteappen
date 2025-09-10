// Basic functionality for the math app with profile setup

document.addEventListener('DOMContentLoaded', function() {
    // Profile setup variables
    let selectedUsername = '';
    let selectedAirplane = '';
    let selectedAirplaneImg = '';
    
    // Initialize profile setup
    initProfileSetup();

    // Audio context for sound effects
    let audioContext = null;

    function initProfileSetup() {
        const profileSetup = document.getElementById('profile-setup');
        const mainGame = document.getElementById('main-game');
        const usernameInput = document.getElementById('username-input');
        const airplaneOptions = document.querySelectorAll('.airplane-option');
        const startGameBtn = document.getElementById('start-game-btn');
        
        // Show profile setup, hide main game
        profileSetup.classList.remove('hidden');
        mainGame.classList.add('hidden');
        
        // Handle airplane selection
        airplaneOptions.forEach(option => {
            option.addEventListener('click', function() {
                // Remove selected class from all options
                airplaneOptions.forEach(opt => opt.classList.remove('selected'));
                // Add selected class to clicked option
                this.classList.add('selected');
                selectedAirplane = this.getAttribute('data-plane');
                selectedAirplaneImg = this.querySelector('img').src;
                checkProfileComplete();
            });
        });
        
        // Handle username input
        usernameInput.addEventListener('input', function() {
            selectedUsername = this.value.trim();
            checkProfileComplete();
        });
        
        // Handle Enter key in username input
        usernameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !startGameBtn.disabled) {
                startMainGame();
            }
        });
        
        // Handle start game button
        startGameBtn.addEventListener('click', startMainGame);
        
        function checkProfileComplete() {
            if (selectedUsername && selectedAirplane) {
                startGameBtn.disabled = false;
            } else {
                startGameBtn.disabled = true;
            }
        }
        
        function startMainGame() {
            if (selectedUsername && selectedAirplane) {
                // Update profile display in main game
                document.getElementById('profile-name').textContent = selectedUsername;
                document.getElementById('profile-plane').src = selectedAirplaneImg;
                document.getElementById('profile-plane').alt = selectedAirplane;
                
                // Update module buttons to show selected airplane
                updateModuleButtons();
                
                // Hide profile setup, show main game
                profileSetup.classList.add('hidden');
                mainGame.classList.remove('hidden');
            }
        }
    }

    function updateModuleButtons() {
        const moduleButtons = document.querySelectorAll('.module-button');
        const airplaneHTML = `<img src="${selectedAirplaneImg}" class="button-airplane" alt="${selectedAirplane}" />`;
        
        moduleButtons.forEach(button => {
            // Replace ✈️ with selected airplane
            button.innerHTML = button.innerHTML.replace('✈️', airplaneHTML);
        });
    }

    function initAudio() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    function playTakeoffSound() {
        if (!audioContext) initAudio();
        
        // Main swoosh oscillator
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Create a "swoosh" takeoff sound: start low, sweep up
        oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.6);
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.6);
        
        // Add a short "thrust" sound at the beginning
        const thrustOsc = audioContext.createOscillator();
        const thrustGain = audioContext.createGain();
        
        thrustOsc.connect(thrustGain);
        thrustGain.connect(audioContext.destination);
        
        thrustOsc.frequency.setValueAtTime(200, audioContext.currentTime);
        thrustGain.gain.setValueAtTime(0.1, audioContext.currentTime);
        thrustGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        thrustOsc.start(audioContext.currentTime);
        thrustOsc.stop(audioContext.currentTime + 0.1);
    }

    function playCrashSound() {
        if (!audioContext) initAudio();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Create a "crash" sound: start mid, sweep down quickly
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    }
    const moduleSelector = document.getElementById('module-selector');
    const gameArea = document.getElementById('game-area');
    const taskDisplay = document.getElementById('task-display');
    const feedbackArea = document.getElementById('feedback-area');
    const feedbackText = document.getElementById('feedback-text');
    const backToModules = document.getElementById('back-to-modules');
    const scoreboard = document.getElementById('scoreboard');
    const tips = document.getElementById('tips');
    const showTips = document.getElementById('show-tips');

    let currentModule = null;
    let currentTask = null;
    let wrongAttempts = 0;
    let correctCount = 0;
    let totalCount = 0;

    // Module buttons
    document.querySelectorAll('.module-button').forEach(button => {
        button.addEventListener('click', function() {
            currentModule = this.getAttribute('data-module');
            startGame();
        });
    });

    function startGame() {
        moduleSelector.classList.add('hidden');
        gameArea.classList.remove('hidden');
        generateTask();
        setupInput();
        tips.innerHTML = ''; // Hide tips initially
    }

    function setTips() {
        const parts = currentModule.split('_');
        const operation = parts[0];
        let tipText = '';
        if (operation === 'addition') {
            tipText = 'For å legge til, tell alle flyene sammen. For eksempel, hvis du har 3 fly og legger til 2 fly, blir det 5 fly totalt.';
        } else if (operation === 'subtraction') {
            tipText = 'For å trekke fra, fjern noen fly og tell de som er igjen. For eksempel, hvis du har 5 fly og fjerner 2, blir det 3 fly igjen.';
        } else if (operation === 'multiplication') {
            tipText = 'Multiplikasjon er å legge til samme tall flere ganger. For eksempel, 3×4 betyr 3+3+3+3, som er 12 fly totalt.';
        }
        tips.innerHTML = tipText;
    }

    function setupInput() {
        const answerInput = document.getElementById('answer-input');

        answerInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const userAnswer = parseInt(answerInput.value);
                if (!isNaN(userAnswer)) {
                    checkAnswer(userAnswer);
                    answerInput.value = '';
                }
            }
        });

        answerInput.addEventListener('input', function() {
            feedbackArea.classList.add('hidden'); // Hide feedback when typing new answer
        });
    }

    function generateTask() {
        wrongAttempts = 0; // Reset wrong attempts for new task
        tips.innerHTML = ''; // Hide tips for new task
        showTips.textContent = '💡 Tips'; // Reset button text
        const parts = currentModule.split('_');
        const operation = parts[0]; // addition, subtraction, or multiplication
        const range = parts[1].split('-')[1]; // e.g., 10
        const maxNum = parseInt(range);

        let num1, num2;
        // Use selected airplane image instead of emoji
        const getAirplaneHTML = (count) => {
            let html = '';
            for (let i = 0; i < count; i++) {
                html += `<img src="${selectedAirplaneImg}" class="task-airplane" alt="${selectedAirplane}" />`;
            }
            return html;
        };

        if (operation === 'addition') {
            num1 = Math.floor(Math.random() * maxNum) + 1; // 1 to maxNum
            num2 = Math.floor(Math.random() * maxNum) + 1;
            const planes1 = getAirplaneHTML(num1);
            const planes2 = getAirplaneHTML(num2);
            currentTask = { num1, num2, answer: num1 + num2 };
            taskDisplay.innerHTML = `<span class="number">${num1}</span> ${planes1} <span class="operator">+</span> <span class="number">${num2}</span> ${planes2} <span class="equals">=</span> <span class="question-mark">?</span>`;
        } else if (operation === 'subtraction') {
            num1 = Math.floor(Math.random() * maxNum) + 1;
            num2 = Math.floor(Math.random() * num1) + 1; // Ensure num1 >= num2, both >=1
            const planes1 = getAirplaneHTML(num1);
            const planes2 = getAirplaneHTML(num2);
            currentTask = { num1, num2, answer: num1 - num2 };
            taskDisplay.innerHTML = `<span class="number">${num1}</span> ${planes1} <span class="operator">-</span> <span class="number">${num2}</span> ${planes2} <span class="equals">=</span> <span class="question-mark">?</span>`;
        } else if (operation === 'multiplication') {
            num1 = Math.floor(Math.random() * maxNum) + 1;
            num2 = Math.floor(Math.random() * maxNum) + 1;
            const planes1 = getAirplaneHTML(num1);
            const planes2 = getAirplaneHTML(num2);
            currentTask = { num1, num2, answer: num1 * num2 };
            taskDisplay.innerHTML = `<span class="number">${num1}</span> ${planes1} <span class="operator">×</span> <span class="number">${num2}</span> ${planes2} <span class="equals">=</span> <span class="question-mark">?</span>`;
        }
    }

    function checkAnswer(userAnswer) {
        totalCount++;
        if (userAnswer === currentTask.answer) {
            correctCount++;
            playTakeoffSound(); // Play takeoff sound on correct answer
            feedbackText.textContent = 'Supert! Du fikk det riktig! ✈️🚀';
            feedbackText.className = 'feedback-correct';
            feedbackArea.classList.remove('hidden');
            updateScore();
            // Auto-advance to next task after a short delay
            setTimeout(function() {
                feedbackArea.classList.add('hidden');
                generateTask();
            }, 2000); // 2 seconds delay
        } else {
            wrongAttempts++;
            playCrashSound(); // Play crash sound on wrong answer
            if (wrongAttempts >= 3) {
                feedbackText.textContent = `Prøv igjen! Riktig svar er ${currentTask.answer}. Du klarer det! 💪`;
            } else {
                feedbackText.textContent = 'Prøv igjen! Du klarer det! 💪';
            }
            feedbackText.className = 'feedback-incorrect';
            feedbackArea.classList.remove('hidden');
            // Do not advance, let them try again
        }
    }

    function updateScore() {
        document.getElementById('correct-count').textContent = `Riktige: ${correctCount}`;
        document.getElementById('total-count').textContent = `Totalt: ${totalCount}`;
        
        // Use selected airplane in scoreboard
        let scoreboardHTML = '';
        for (let i = 0; i < correctCount; i++) {
            scoreboardHTML += `<img src="${selectedAirplaneImg}" class="score-airplane" alt="${selectedAirplane}" />`;
        }
        scoreboard.innerHTML = scoreboardHTML;
    }

    backToModules.addEventListener('click', function() {
        gameArea.classList.add('hidden');
        moduleSelector.classList.remove('hidden');
    });

    showTips.addEventListener('click', function() {
        if (tips.innerHTML === '') {
            setTips();
            showTips.textContent = 'Skjul Tips';
        } else {
            tips.innerHTML = '';
            showTips.textContent = '💡 Tips';
        }
    });
});
