// Basic functionality for the math app

document.addEventListener('DOMContentLoaded', function() {
    // Vis valgt brukerbilde i spillrommet
    function showUserImage() {
        const userImageArea = document.getElementById('user-image-area');
        if (!userImageArea) return;
        const user = sessionStorage.getItem('selectedUser');
        if (!user) {
            userImageArea.innerHTML = '';
            return;
        }
        // Map brukernavn til filnavn
        const imageMap = {
            'Airbus Beluga': 'Airbus Beluga.jpg',
            'C5 Galaxy': 'C5-galaxy.jpg',
            'Concorde': 'Concorde.jpg',
            'SR-71 Blackbird': 'SR-71 Blackbird.jpg',
            'Airbus A380': 'Airbus-380.jpg',
            'Bell X-1': 'Bell-X1.jpg',
            'Wright Flyer': 'Wright.jpg',
            'Antonov An-225': 'antonov-an-225.jpg',
            'Piaggio P.180 Avanti': 'piaggio-p.180-avanti.jpg'
        };
        const imgSrc = imageMap[user] ? `bilder/${imageMap[user]}` : '';
        if (imgSrc) {
            userImageArea.innerHTML = `
                <div style=\"display:flex;flex-direction:column;align-items:center;\">
                    <img src=\"${imgSrc}\" alt=\"${user}\" style=\"width:340px;height:340px;object-fit:cover;border-radius:2.5rem;box-shadow:0 10px 40px rgba(0,0,0,0.18);background:#e0f6ff;border:8px solid #2196F3;\">
                    <div style='font-size:2em;color:#023e8a;font-weight:700;margin-top:1.2rem;text-shadow:0 2px 8px #e0f6ff;'>${user}</div>
                </div>
            `;
        } else {
            userImageArea.innerHTML = '';
        }
    }

    // Audio context for sound effects
    let audioContext = null;

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
    showUserImage();
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
        } else if (operation === 'money') {
            tipText = '1 krone = 100 øre. For å regne ut totalt antall øre: gange kroner med 100 og legg til øre. Eksempel: 5 kr 50 øre = (5×100) + 50 = 550 øre.';
        } else if (operation === 'time') {
            tipText = '1 time = 60 minutter. For å regne ut totalt antall minutter: gange timer med 60 og legg til minutter. Eksempel: 2 timer 30 min = (2×60) + 30 = 150 minutter.';
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
        const operation = parts[0]; // addition, subtraction, multiplication, money, time
        
        // Handle special modules
        if (operation === 'money') {
            generateMoneyTask();
            return;
        } else if (operation === 'time') {
            generateTimeTask();
            return;
        }
        
        // Handle regular math operations
        const range = parts[1].split('-'); // e.g., ["1", "10"] or ["10", "100"]
        const minNum = parseInt(range[0]);
        const maxNum = parseInt(range[1]);

        let num1, num2;
        if (operation === 'addition') {
            num1 = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
            num2 = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
            currentTask = { num1, num2, answer: num1 + num2 };
            taskDisplay.innerHTML = `<span class="number">${num1}</span> <span class="operator">+</span> <span class="number">${num2}</span> <span class="equals">=</span> <span class="question-mark">?</span>`;
        } else if (operation === 'subtraction') {
            num1 = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
            num2 = Math.floor(Math.random() * (num1 - minNum + 1)) + minNum; // Ensure num1 >= num2
            if (num2 > num1) { // Extra safety check
                const temp = num1;
                num1 = num2;
                num2 = temp;
            }
            currentTask = { num1, num2, answer: num1 - num2 };
            taskDisplay.innerHTML = `<span class="number">${num1}</span> <span class="operator">-</span> <span class="number">${num2}</span> <span class="equals">=</span> <span class="question-mark">?</span>`;
        } else if (operation === 'multiplication') {
            num1 = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
            num2 = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
            currentTask = { num1, num2, answer: num1 * num2 };
            taskDisplay.innerHTML = `<span class="number">${num1}</span> <span class="operator">×</span> <span class="number">${num2}</span> <span class="equals">=</span> <span class="question-mark">?</span>`;
        }
    }

    function generateMoneyTask() {
        // Random type: addition or subtraction with money
        const types = ['add', 'subtract', 'convert'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        if (type === 'add') {
            const kr1 = Math.floor(Math.random() * 100) + 1;
            const ore1 = Math.floor(Math.random() * 100);
            const kr2 = Math.floor(Math.random() * 100) + 1;
            const ore2 = Math.floor(Math.random() * 100);
            const totalOre = (kr1 * 100 + ore1) + (kr2 * 100 + ore2);
            const answerKr = Math.floor(totalOre / 100);
            const answerOre = totalOre % 100;
            currentTask = { answer: totalOre };
            taskDisplay.innerHTML = `<div style="font-size:1.5em;margin:20px 0;">
                💰 ${kr1} kr ${ore1} øre + ${kr2} kr ${ore2} øre = ?<br>
                <small style="color:#666;">Svar i øre (f.eks. 150 kr 50 øre = 15050 øre)</small>
            </div>`;
        } else if (type === 'subtract') {
            const kr1 = Math.floor(Math.random() * 100) + 50;
            const ore1 = Math.floor(Math.random() * 100);
            const kr2 = Math.floor(Math.random() * kr1);
            const ore2 = Math.floor(Math.random() * 100);
            const totalOre = (kr1 * 100 + ore1) - (kr2 * 100 + ore2);
            currentTask = { answer: totalOre };
            taskDisplay.innerHTML = `<div style="font-size:1.5em;margin:20px 0;">
                💰 ${kr1} kr ${ore1} øre - ${kr2} kr ${ore2} øre = ?<br>
                <small style="color:#666;">Svar i øre (f.eks. 150 kr 50 øre = 15050 øre)</small>
            </div>`;
        } else {
            // Convert kr and øre to total øre
            const kr = Math.floor(Math.random() * 200) + 1;
            const ore = Math.floor(Math.random() * 100);
            const totalOre = kr * 100 + ore;
            currentTask = { answer: totalOre };
            taskDisplay.innerHTML = `<div style="font-size:1.5em;margin:20px 0;">
                💰 Hvor mange øre er ${kr} kr ${ore} øre?
            </div>`;
        }
    }

    function generateTimeTask() {
        const types = ['add_minutes', 'subtract_minutes', 'hours_to_minutes'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        if (type === 'add_minutes') {
            const hours = Math.floor(Math.random() * 12) + 1;
            const minutes = Math.floor(Math.random() * 60);
            const addMinutes = Math.floor(Math.random() * 120) + 10;
            const totalMinutes = hours * 60 + minutes + addMinutes;
            const answerHours = Math.floor(totalMinutes / 60);
            const answerMinutes = totalMinutes % 60;
            currentTask = { answer: totalMinutes };
            taskDisplay.innerHTML = `<div style="font-size:1.5em;margin:20px 0;">
                ⏰ Klokka er ${hours}:${minutes.toString().padStart(2, '0')}<br>
                Om ${addMinutes} minutter, hvor mange minutter er klokka totalt?<br>
                <small style="color:#666;">Svar i totalt antall minutter</small>
            </div>`;
        } else if (type === 'subtract_minutes') {
            const hours = Math.floor(Math.random() * 12) + 3;
            const minutes = Math.floor(Math.random() * 60);
            const subtractMinutes = Math.floor(Math.random() * 100) + 10;
            const totalMinutes = Math.max(0, hours * 60 + minutes - subtractMinutes);
            currentTask = { answer: totalMinutes };
            taskDisplay.innerHTML = `<div style="font-size:1.5em;margin:20px 0;">
                ⏰ Klokka er ${hours}:${minutes.toString().padStart(2, '0')}<br>
                For ${subtractMinutes} minutter siden, hvor mange minutter var klokka?<br>
                <small style="color:#666;">Svar i totalt antall minutter</small>
            </div>`;
        } else {
            // Convert hours and minutes to total minutes
            const hours = Math.floor(Math.random() * 10) + 1;
            const minutes = Math.floor(Math.random() * 60);
            const totalMinutes = hours * 60 + minutes;
            currentTask = { answer: totalMinutes };
            taskDisplay.innerHTML = `<div style="font-size:1.5em;margin:20px 0;">
                ⏰ Hvor mange minutter er ${hours} timer og ${minutes} minutter?
            </div>`;
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
            const motivators = [
                'Prøv igjen! Du klarer det! 💪',
                'Du er på rett vei, prøv en gang til! 🚀',
                'Ikke gi opp, du får det til! 🙌'
            ];
            if (wrongAttempts >= 3) {
                feedbackText.textContent = `Riktig svar er ${currentTask.answer}, dette klarer du neste gang!`;
            } else {
                const idx = Math.floor(Math.random() * motivators.length);
                feedbackText.textContent = motivators[idx];
            }
            feedbackText.className = 'feedback-incorrect';
            feedbackArea.classList.remove('hidden');
            // Do not advance, let them try again
        }
    }

    function updateScore() {
        document.getElementById('correct-count').textContent = `Riktige: ${correctCount}`;
        document.getElementById('total-count').textContent = `Totalt: ${totalCount}`;
    scoreboard.innerHTML = '✈️'.repeat(correctCount);
    }

    backToModules.addEventListener('click', function() {
        gameArea.classList.add('hidden');
        moduleSelector.classList.remove('hidden');
    });

        // Tilbake til forsiden-knapp
        const backToForside = document.getElementById('back-to-forside');
        if (backToForside) {
            backToForside.addEventListener('click', function() {
                window.location.href = 'index.html';
            });
        }

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
