
  // --- DESKTOP: Secret Word Typist ("stats") ---
  const secretWord = 'stats';
  let typedBuffer = '';

  window.addEventListener('keydown', (e) => {
    // Only care about single letters to prevent issues with Shift/Enter
    if (e.key.length === 1) { 
      typedBuffer += e.key.toLowerCase();
      
      // Keep the buffer trimmed to the length of our secret word
      if (typedBuffer.length > secretWord.length) {
        typedBuffer = typedBuffer.slice(-secretWord.length);
      }
      
      // If it matches, redirect
      if (typedBuffer === secretWord) {
        window.location.href = 'stats.html';
      }
    }
  });

  // --- MOBILE: Triple Tap Secret Zone ---
  // If a user quickly taps 3 times anywhere on the lower bottom of your screen, they get redirected.
  let tapCount = 0;
  let lastTapTime = 0;

  window.addEventListener('touchend', (e) => {
    const currentTime = new Date().getTime();
    const tapInterval = currentTime - lastTapTime;
    
    // Check if the tap happened in the bottom 15% of the screen (your secret zone)
    const touchY = e.changedTouches[0].clientY;
    const screenHeight = window.innerHeight;
    const isInSecretZone = touchY > (screenHeight * 0.85);

    if (isInSecretZone) {
      // Taps must happen within 400ms of each other to count as sequential
      if (tapInterval < 400) {
        tapCount++;
      } else {
        tapCount = 1; // Reset if they took too long
      }
      
      lastTapTime = currentTime;

      if (tapCount === 3) {
        window.location.href = 'stats.html';
      }
    }
  });
