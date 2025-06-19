function loadGame(game) {
  const params = new URLSearchParams({
    gravity: 0.4,
    jump: -6,
    birdColor: "yellow"
  });

  const frame = document.getElementById("gameFrame");
  frame.src = `templates/${game}/index.html?${params.toString()}`;

  // Switch to game screen
  document.getElementById("homeScreen").classList.add("hidden");
  document.getElementById("gameScreen").classList.remove("hidden");
}

function goHome() {
  // Stop the current game
  const frame = document.getElementById("gameFrame");
  frame.src = "";

  // Show home screen again
  document.getElementById("gameScreen").classList.add("hidden");
  document.getElementById("homeScreen").classList.remove("hidden");
}
