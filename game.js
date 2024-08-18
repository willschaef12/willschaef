// Other JavaScript code...

function startGame() {
    music.play().catch(error => {
        console.log("Error playing music:", error);
    });

    setTimeout(() => {
        showWaveMessage = false; 
        update(); 
    }, 3000);
}

// Show loading screen and handle character selection
document.getElementById('characterSelection').addEventListener('click', function(e) {
    if (e.target.classList.contains('character')) {
        document.querySelectorAll('.character').forEach(char => char.classList.remove('selected'));
        e.target.classList.add('selected');
        selectedCharacter = e.target.getAttribute('data-character');
    }
});

document.getElementById('startGame').addEventListener('click', function() {
    if (selectedCharacter) {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('gameCanvas').style.display = 'block';
        startGame();
    } else {
        alert('Please select a character first.');
    }
});
