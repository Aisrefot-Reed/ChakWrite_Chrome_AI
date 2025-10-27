// ChakWrite popup script
console.log('ChakWrite popup loaded');

// Settings panel toggle with debugging
const settingsBtn = document.getElementById('settingsBtn');
console.log('Settings button found:', settingsBtn);

settingsBtn.addEventListener('click', function(e) {
    console.log('Settings button clicked!');
    e.preventDefault();
    e.stopPropagation();
    
    const panel = document.getElementById('settingsPanel');
    const wasActive = panel.classList.contains('active');
    panel.classList.toggle('active');
    console.log('Settings panel toggled:', wasActive ? 'closing' : 'opening');
});

// Mode button handling
document.addEventListener('DOMContentLoaded', function() {
    const modeButtons = document.querySelectorAll('.mode-btn');
    const promptAPIToggle = document.getElementById('promptAPIToggle');

    // Load active mode from storage
    chrome.storage.local.get(['activeMode', 'promptAPIEnabled', 'overlayEnabled'], function(result) {
        const activeMode = result.activeMode || 'dyslexia';
        
        // Update UI to show active mode
        modeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === activeMode);
        });

        // Update toggles
        if (promptAPIToggle) {
            promptAPIToggle.checked = result.promptAPIEnabled !== false;
        }
    });

    // Handle mode button clicks with debugging
    modeButtons.forEach(btn => {
        console.log('Attaching click listener to mode button:', btn.dataset.mode);
        btn.addEventListener('click', function(e) {
            const mode = this.dataset.mode;
            console.log('Mode button clicked:', mode);
            
            // Update UI
            modeButtons.forEach(b => {
                const wasActive = b.classList.contains('active');
                b.classList.remove('active');
                if (wasActive && b === this) {
                    console.log('Removed active class from clicked button');
                }
            });
            this.classList.add('active');
            console.log('Added active class to:', mode);
            
            // Save to storage
            chrome.storage.local.set({ activeMode: mode }, function() {
                console.log('Mode saved to storage:', mode);
            });
        });
    });

    // Handle Prompt API toggle
    if (promptAPIToggle) {
        promptAPIToggle.addEventListener('change', function() {
            chrome.storage.local.set({ promptAPIEnabled: this.checked });
        });
    }
});
