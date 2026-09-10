// CONFIGURATION CONFIG
/*
const videoId = 'dQw4w9WgXcQ'; 
const aspectRatio = '4:3'; // Options: '4:3', '16:9', '1:1'
const modalOverlay = document.getElementById('modalOverlay');
const openModalBtn = document.getElementById('openModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const videoContainer = document.getElementById('videoContainer');
*/
// 1. Calculate dynamic aspect ratio percentage rules
function applyAspectRatio(ratio) {
    const parts = ratio.split(':');
    if (parts.length === 2) {
        const width = parseFloat(parts[0]);
        const height = parseFloat(parts[1]);
        const paddingPercentage = (height / width) * 100;
        videoContainer.style.paddingBottom = `${paddingPercentage}%`;
    }
}
applyAspectRatio(aspectRatio);

// 2. Open Modal handler -> Injects the source URL to instantly force autoplay
openModalBtn.addEventListener('click', () => {
    modalOverlay.style.visibility = "visible";
    modalOverlay.classList.add('active');
    
    // Explicit tracking origin parameter ensures browser flags bypass modern sandboxed domain blocks
    const localOrigin = window.location.origin && window.location.origin !== 'null' ? window.location.origin : '*';

    // Constructs the secure URL path with explicit autoplay and origin arguments unblocked
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(localOrigin)}`;
    modalVideo.setAttribute('src', embedUrl);
});

// 3. Close Modal handler -> Strips out the source attribute cleanly
// Emptying the src completely cuts connection lines and stops all music/video instantly
function closeModal() {
    modalOverlay.classList.remove('active');
    modalVideo.setAttribute('src', ''); 
}

closeModalBtn.addEventListener('click', closeModal);

modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        closeModal();
    }
});

// 4. Safely switch off pointer visibility blocks only after overlay finish fading
modalOverlay.addEventListener('transitionend', (e) => {
    if (!modalOverlay.classList.contains('active') && e.propertyName === 'opacity') {
        modalOverlay.style.visibility = "hidden";
    }
});

// 5. Accessibility Feature: Pressing the escape key automatically runs close operations
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
        closeModal();
    }
});