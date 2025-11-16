let signalInterval = null;
let arrowInterval = null;
let signalCount = 0;
let arrowCount = 0;
let totalRepetitions = 0;
let currentRepetition = 0;
let isRunning = false;
let arrowIntervalValue = 0;
let audioContext = null;

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const controls = document.getElementById('controls');
const displayArea = document.getElementById('displayArea');
const signalIndicator = document.getElementById('signalIndicator');
const arrowContainer = document.getElementById('arrowContainer');
const currentRepSpan = document.getElementById('currentRep');
const totalRepSpan = document.getElementById('totalRep');

startBtn.addEventListener('click', startTraining);
stopBtn.addEventListener('click', stopTraining);

function startTraining() {
    if (isRunning) return;
    
    // Get values from inputs
    const signalIntervalValue = parseFloat(document.getElementById('signalInterval').value) * 1000;
    arrowIntervalValue = parseFloat(document.getElementById('arrowInterval').value) * 1000;
    totalRepetitions = parseInt(document.getElementById('repetitions').value);
    
    // Initialize audio context for beep sound
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.warn('Web Audio API not supported, beep will not work');
    }
    
    // Validate inputs
    if (signalIntervalValue <= 0 || arrowIntervalValue <= 0 || totalRepetitions <= 0) {
        alert('Please enter valid values (all must be greater than 0)');
        return;
    }
    
    // Reset state
    signalCount = 0;
    arrowCount = 0;
    currentRepetition = 0;
    isRunning = true;
    
    // Update UI
    controls.style.display = 'none';
    displayArea.style.display = 'flex';
    startBtn.style.display = 'none';
    stopBtn.style.display = 'block';
    stopBtn.style.position = 'absolute';
    stopBtn.style.top = '20px';
    stopBtn.style.right = '20px';
    stopBtn.style.zIndex = '100';
    stopBtn.style.width = 'auto';
    stopBtn.style.padding = '10px 20px';
    arrowContainer.innerHTML = '';
    signalIndicator.textContent = '';
    signalIndicator.classList.remove('active');
    document.querySelector('.container').classList.add('fullscreen');
    document.body.classList.add('fullscreen');
    
    totalRepSpan.textContent = totalRepetitions;
    currentRepSpan.textContent = '0';
    currentRepetition = 0;
    
    // Calculate how many signals per arrow cycle
    const signalsPerArrow = Math.round(arrowIntervalValue / signalIntervalValue);
    
    // Start signal interval
    signalInterval = setInterval(() => {
        triggerSignal();
        signalCount++;
        
        // Check if it's time to show an arrow
        if (signalCount % signalsPerArrow === 0) {
            showArrow();
            arrowCount++;
            currentRepetition++;
            currentRepSpan.textContent = currentRepetition;
            
            // Check if we've reached the total repetitions
            if (currentRepetition >= totalRepetitions) {
                stopTraining();
            }
        }
    }, signalIntervalValue);
    
    // Trigger first signal immediately
    triggerSignal();
    signalCount = 1; // Start counting from 1 since we just triggered
}

function triggerSignal() {
    signalIndicator.classList.add('active');
    signalIndicator.textContent = '⚡';
    
    // Play beep sound
    playBeep();
    
    // Create a subtle vibration if supported
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
    
    setTimeout(() => {
        signalIndicator.classList.remove('active');
        signalIndicator.textContent = '';
    }, 200);
}

function playBeep() {
    if (!audioContext) return;
    
    // Resume audio context if suspended (required by some browsers)
    if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {});
    }
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800; // Beep frequency in Hz
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        console.warn('Could not play beep:', e);
    }
}

function showArrow() {
    // Clear previous arrow
    arrowContainer.innerHTML = '';
    
    // Randomly choose left (red) or right (green) arrow
    const isLeft = Math.random() < 0.5;
    const arrow = document.createElement('div');
    arrow.className = `arrow ${isLeft ? 'left' : 'right'}`;
    arrow.textContent = isLeft ? '←' : '→';
    
    arrowContainer.appendChild(arrow);
    
    // Remove arrow after a short delay
    setTimeout(() => {
        if (arrow.parentNode) {
            arrow.style.opacity = '0';
            arrow.style.transition = 'opacity 0.3s';
            setTimeout(() => {
                if (arrow.parentNode) {
                    arrowContainer.removeChild(arrow);
                }
            }, 300);
        }
    }, arrowIntervalValue * 0.8); // Show arrow for 80% of the interval
}

function stopTraining() {
    if (!isRunning) return;
    
    isRunning = false;
    
    // Clear intervals
    if (signalInterval) {
        clearInterval(signalInterval);
        signalInterval = null;
    }
    
    if (arrowInterval) {
        clearInterval(arrowInterval);
        arrowInterval = null;
    }
    
    // Reset UI
    controls.style.display = 'flex';
    displayArea.style.display = 'none';
    startBtn.style.display = 'block';
    stopBtn.style.display = 'none';
    stopBtn.style.position = '';
    stopBtn.style.top = '';
    stopBtn.style.right = '';
    stopBtn.style.zIndex = '';
    stopBtn.style.width = '';
    stopBtn.style.padding = '';
    signalIndicator.classList.remove('active');
    signalIndicator.textContent = '';
    arrowContainer.innerHTML = '';
    document.querySelector('.container').classList.remove('fullscreen');
    document.body.classList.remove('fullscreen');
    
    // Reset counters
    signalCount = 0;
    arrowCount = 0;
    currentRepetition = 0;
    
    // Close audio context
    if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().catch(() => {});
    }
    audioContext = null;
}

// Prevent accidental page refresh on mobile
window.addEventListener('beforeunload', (e) => {
    if (isRunning) {
        e.preventDefault();
        e.returnValue = '';
    }
});

