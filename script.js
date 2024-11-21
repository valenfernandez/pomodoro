// DOM Elements
const sessionType = document.getElementById('session-type');
const timerMinutes = document.getElementById('timer-minutes');
const timerSeconds = document.getElementById('timer-seconds');
const startButton = document.getElementById('start-button');
const pauseButton = document.getElementById('pause-button');
const skipButton = document.getElementById('skip-button');
const stopButton = document.getElementById('stop-button');
const pomodoroContainer = document.getElementById('pomodoro-container'); // Reference to the container
const volumeSlider = document.getElementById('volume-slider');

const DEFAULT_TIME = 20 * 60; 

const workMusic = new Audio('./audio/work-music.mp3');
const breakMusic = new Audio('./audio/break-music.mp3');



let timerInterval;
let isWorkMode = true;
let timeRemaining = DEFAULT_TIME;
let sessionsLeft = 3 
let isTimerInitialized = false;
let noteToDelete = null; 


skipButton.style.display = 'none'; 
workMusic.volume = 0.5;
breakMusic.volume = 0.5;
workMusic.loop = true; 
breakMusic.loop = true; 

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timerMinutes.textContent = minutes.toString().padStart(2, '0');
    timerSeconds.textContent = seconds.toString().padStart(2, '0');
}

function startTimer() {
    if (timerInterval) return; // Prevent multiple intervals

    if (!isTimerInitialized) {
        setTimerMode(); // Only call this here the first time the timer starts. Not if we have just paused.
        isTimerInitialized = true; // Set the flag to true
    }
    startButton.disabled = true;

    timerInterval = setInterval(() => {
        if (timeRemaining > 0) {
            timeRemaining--;
            updateTimerDisplay();
        } else {
            sessionsLeft--;
            clearInterval(timerInterval);
            timerInterval = null;
            if (sessionsLeft > 0){
                isWorkMode = !isWorkMode;
                setTimerMode();
                startTimer();
            } else{
                setTimerMode();
                stopMusic();
                startButton.disabled = false;
            }
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    startButton.disabled = false;
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    isWorkMode = true;
    setTimerMode();
    stopMusic();
    isTimerInitialized = false;
    startButton.disabled = false;
}

function skipBreak() {
    if (!isWorkMode) {
        isWorkMode = true;
        startWorkMusic();
        pomodoroContainer.style.backgroundColor = '#B298DC';
        skipButton.style.display = 'none'; 
        timeRemaining = sessionType.value.split('-')[0] * 60;
        updateTimerDisplay();
        startTimer();
    }
}

function startWorkMusic(){
    breakMusic.pause();
    breakMusic.currentTime = 0; // Reset break music
    workMusic.play(); // Start work music
}

function startBreakMusic(){
    workMusic.pause();
    workMusic.currentTime = 0; // Reset work music
    breakMusic.play(); // Start break music
}

function stopMusic(){
    workMusic.pause();
    workMusic.currentTime = 0;
    breakMusic.pause();
    breakMusic.currentTime = 0;
}

function setTimerMode() {
    const [workMinutes, breakMinutes] = sessionType.value.split('-').map(Number);
    if (isWorkMode) {
        timeRemaining = workMinutes * 60;
        pomodoroContainer.style.backgroundColor = '#B298DC';
        skipButton.style.display = 'none'; // Hide Skip button during Work mode
        startWorkMusic();
    } else {
        timeRemaining = breakMinutes * 60;
        pomodoroContainer.style.backgroundColor = '#B8D0EB';
        skipButton.style.display = 'inline-block'; // Show Skip button during Break mode
        startBreakMusic();
    }

    updateTimerDisplay();
}

function makeNoteDraggable(note) {
    let offsetX = 0, offsetY = 0, isDragging = false;

    note.addEventListener("mousedown", (e) => {
        const isResizing = e.target === note && 
            (e.offsetX > note.offsetWidth - 20 && e.offsetY > note.offsetHeight - 20);

        if (!isResizing) {
            isDragging = true;
            offsetX = e.offsetX;
            offsetY = e.offsetY;
            note.style.zIndex = 100; // Bring dragged note to the front
        }
    });

    document.addEventListener("mousemove", (e) => {
        if (isDragging) {
            const newX = e.clientX - offsetX;
            const newY = e.clientY - offsetY;

            note.style.left = `${newX}px`;
            note.style.top = `${newY}px`;

            const trashBin = document.querySelector("#trash-bin");
            const trashRect = trashBin.getBoundingClientRect();
            const noteRect = note.getBoundingClientRect();

            if (
                noteRect.right > trashRect.left &&
                noteRect.left < trashRect.right &&
                noteRect.bottom > trashRect.top &&
                noteRect.top < trashRect.bottom
            ) {
                trashBin.style.opacity = "0.7"; // Highlight trash bin
            } else {
                trashBin.style.opacity = "1";
            }
        }
    });

    document.addEventListener("mouseup", () => {

        const trashBin = document.querySelector("#trash-bin");
        const trashRect = trashBin.getBoundingClientRect();
        const noteRect = note.getBoundingClientRect();

        // Check if note is dropped in trash bin
        if (
            isDragging &&
            noteRect.right > trashRect.left &&
            noteRect.left < trashRect.right &&
            noteRect.bottom > trashRect.top &&
            noteRect.top < trashRect.bottom
        ) {
            // Show custom confirmation popup
            showConfirmation(note);
        }

        trashBin.style.opacity = "1"; // Reset trash bin style
        isDragging = false;
    });
}


function createStickyNote() {
    const note = document.createElement("div");
    note.classList.add("sticky-note");

    // Create a textarea inside the note
    const textarea = document.createElement("textarea");
    note.appendChild(textarea);

    // Set initial position for the note (outside the container)
    note.style.top = `${Math.random() * 50 + 20}px`; // Random top position
    note.style.left = `${Math.random() * 50 + 20}px`; // Random left position

    // Append the note to the body instead of the container
    document.body.appendChild(note);

    // Enable dragging
    makeNoteDraggable(note);
}


function saveNotes() {
    const notes = Array.from(document.querySelectorAll(".sticky-note")).map(note => ({
        top: note.style.top,
        left: note.style.left,
        width: note.style.width,
        height: note.style.height,
        content: note.querySelector("textarea").value
    }));
    localStorage.setItem("stickyNotes", JSON.stringify(notes));
}

function loadNotes() {
    const savedNotes = JSON.parse(localStorage.getItem("stickyNotes") || "[]");
    savedNotes.forEach(noteData => {
        const note = document.createElement("div");
        note.classList.add("sticky-note");
        note.style.top = noteData.top;
        note.style.left = noteData.left;
        note.style.width = noteData.width;
        note.style.height = noteData.height;

        const textarea = document.createElement("textarea");
        textarea.value = noteData.content;
        note.appendChild(textarea);

        document.body.appendChild(note); // Append to the body for unrestricted movement
        makeNoteDraggable(note);
    });
}

// Show confirmation popup
function showConfirmation(note) {
    noteToDelete = note; // Save the note to delete
    const popup = document.getElementById("confirmation-popup");
    popup.classList.remove("hidden"); // Show the popup
}

// Hide confirmation popup
function hideConfirmation() {
    const popup = document.getElementById("confirmation-popup");
    popup.classList.add("hidden"); // Hide the popup
    noteToDelete = null; // Reset the note reference
}

// Delete the note after confirmation
function confirmDelete() {
    if (noteToDelete) {
        noteToDelete.remove(); // Remove the note
        hideConfirmation(); // Hide the popup
    }
}


// Event Listeners
startButton.addEventListener('click', startTimer);
pauseButton.addEventListener('click', pauseTimer);
stopButton.addEventListener('click', stopTimer);
skipButton.addEventListener('click', skipBreak);
sessionType.addEventListener('change', () => {
    isWorkMode = true; // Reset to work mode
    isTimerInitialized = false;
    setTimerMode();
    stopMusic();
    
});


volumeSlider.addEventListener('input', (event) => {
    const volume = event.target.value;
    workMusic.volume = volume;
    breakMusic.volume = volume;
});

document.getElementById("add-note-btn").addEventListener("click", createStickyNote);
window.addEventListener("beforeunload", saveNotes);
document.addEventListener("DOMContentLoaded", loadNotes);
document.getElementById("confirm-delete").addEventListener("click", confirmDelete);
document.getElementById("cancel-delete").addEventListener("click", hideConfirmation);



// Initialize Timer Display
updateTimerDisplay();