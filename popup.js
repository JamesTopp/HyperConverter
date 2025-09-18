// Extension toggle functionality
let extensionEnabled = true;
let globallyDisabled = false;
let blacklistedSites = [];
let currentDomain = '';

function getCurrentDomain() {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const url = new URL(tabs[0].url);
            currentDomain = url.hostname;
            updateToggleUI();
        });
    } else {
        currentDomain = 'example.com'; // For preview
        updateToggleUI();
    }
}

function isCurrentSiteBlacklisted() {
    return blacklistedSites.includes(currentDomain);
}

document.getElementById('extensionToggle').addEventListener('click', function() {
    if (globallyDisabled) {
        // If globally disabled, re-enable globally
        globallyDisabled = false;
        extensionEnabled = true;
        updateToggleUI();
        // Save state (only works in actual extension)
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.sync.set({enabled: true, globallyDisabled: false});
        }
    } else if (isCurrentSiteBlacklisted()) {
        // If site is blacklisted, remove from blacklist
        blacklistedSites = blacklistedSites.filter(site => site !== currentDomain);
        extensionEnabled = true;
        updateToggleUI();
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.sync.set({enabled: true, blacklistedSites: blacklistedSites});
        }
    } else {
        // Just toggle current page
        extensionEnabled = !extensionEnabled;
        updateToggleUI();
        // Save state (only works in actual extension)  
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.sync.set({enabled: extensionEnabled});
        }
    }
});

document.getElementById('neverRunButton').addEventListener('click', function() {
    if (currentDomain && !blacklistedSites.includes(currentDomain)) {
        blacklistedSites.push(currentDomain);
        extensionEnabled = false;
        // Update button text
        this.textContent = `🚫 Disabled on ${currentDomain}`;
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.sync.set({blacklistedSites: blacklistedSites, enabled: false});
        }
        updateToggleUI();
    }
});

document.getElementById('disableAllPages').addEventListener('click', function() {
    if (globallyDisabled) {
        // Turn extension back on
        globallyDisabled = false;
        this.textContent = '🔴 Turn off extension';
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.sync.set({globallyDisabled: false});
        }
    } else {
        // Turn extension off
        globallyDisabled = true;
        this.textContent = '🟢 Turn on extension';
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.sync.set({globallyDisabled: true});
        }
    }
    updateToggleUI();
});

document.getElementById('manageBlacklist').addEventListener('click', function() {
    if (blacklistedSites.length === 0) {
        alert('No blocked sites yet');
        return;
    }
    
    const sitesList = blacklistedSites.map((site, index) => 
        `${index + 1}. ${site}`).join('\n');
    const message = `Blocked sites:\n\n${sitesList}\n\nTo unblock a site, visit it and click the toggle.`;
    alert(message);
});

function updateToggleUI() {
    const toggleSwitch = document.getElementById('toggleSwitch');
    const statusText = document.getElementById('statusText');
    const disableOptions = document.getElementById('disableOptions');
    const gearButton = document.getElementById('gearButton');
    const extensionToggle = document.getElementById('extensionToggle');
    
    if (globallyDisabled) {
        toggleSwitch.classList.remove('active');
        statusText.textContent = 'Extension is off';
        disableOptions.style.display = 'none';
        gearButton.style.display = 'inline-block';
        extensionToggle.style.opacity = '0.5';
        extensionToggle.style.cursor = 'pointer';
        document.getElementById('disableAllPages').textContent = '🟢 Turn on extension';
    } else if (isCurrentSiteBlacklisted()) {
        toggleSwitch.classList.remove('active');
        statusText.textContent = `Disabled on ${currentDomain}`;
        disableOptions.style.display = 'none';
        gearButton.style.display = 'inline-block';
        extensionToggle.style.opacity = '1';
        extensionToggle.style.cursor = 'pointer';
    } else if (extensionEnabled) {
        toggleSwitch.classList.add('active');
        statusText.textContent = 'Active on this page';
        disableOptions.style.display = 'none';
        gearButton.style.display = 'inline-block';
        extensionToggle.style.opacity = '1';
        extensionToggle.style.cursor = 'pointer';
        document.getElementById('disableAllPages').textContent = '🔴 Turn off extension';
    } else {
        toggleSwitch.classList.remove('active');
        statusText.textContent = 'Disabled on this page';
        disableOptions.style.display = 'block';
        gearButton.style.display = 'none';
        extensionToggle.style.opacity = '1';
        extensionToggle.style.cursor = 'pointer';
        document.getElementById('disableAllPages').textContent = '🔴 Turn off extension';
    }
}

// Load current state when popup opens (only works in actual extension)
if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.sync.get(['enabled', 'globallyDisabled', 'blacklistedSites'], function(result) {
        extensionEnabled = result.enabled !== false;
        globallyDisabled = result.globallyDisabled || false;
        blacklistedSites = result.blacklistedSites || [];
        getCurrentDomain();
    });
} else {
    // For preview - just set initial state
    getCurrentDomain();
}

// Email validation and submission
const emailInput = document.getElementById('emailInput');
const emailSubmit = document.getElementById('emailSubmit');
const emailValidation = document.getElementById('emailValidation');
const emailSuccess = document.getElementById('emailSuccess');
const emailButtonText = document.getElementById('emailButtonText');
const emailSpinner = document.getElementById('emailSpinner');

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

emailInput.addEventListener('input', function() {
    const email = this.value;
    if (validateEmail(email)) {
        this.classList.add('valid');
        emailValidation.classList.add('show');
        emailSuccess.classList.remove('show');
    } else {
        this.classList.remove('valid');
        emailValidation.classList.remove('show');
        emailSuccess.classList.remove('show');
    }
});

emailInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        emailSubmit.click();
    }
});

document.getElementById('gearButton').addEventListener('click', function() {
    if (blacklistedSites.length === 0) {
        alert('No blocked sites yet');
        return;
    }
    
    const sitesList = blacklistedSites.map((site, index) => 
        `${index + 1}. ${site}`).join('\n');
    const message = `Blocked sites:\n\n${sitesList}\n\nTo unblock a site, visit it and click the toggle.`;
    alert(message);
});

emailSubmit.addEventListener('click', async function() {
    const email = emailInput.value;
    if (email && validateEmail(email)) {
        // Show loading state
        emailSubmit.disabled = true;
        emailButtonText.style.display = 'none';
        emailSpinner.style.display = 'block';
        emailValidation.classList.remove('show');
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Show success state and clear email first
        emailSpinner.style.display = 'none';
        emailButtonText.textContent = 'Joined!';
        emailButtonText.style.display = 'block';
        
        // Clear email and validation, then show success message
        emailInput.value = '';
        emailInput.classList.remove('valid');
        emailValidation.classList.remove('show');
        
        // Small delay before showing "Done." message
        setTimeout(() => {
            emailSuccess.classList.add('show');
        }, 200);
        
        // Reset everything after showing success
        setTimeout(() => {
            emailSuccess.classList.remove('show');
            emailButtonText.textContent = 'Join';
            emailSubmit.disabled = false;
        }, 2000);
        
        console.log('Email signup:', email);
    } else {
        alert('Please enter a valid email address');
    }
});

// Feature suggestion
document.getElementById('suggestFeature').addEventListener('click', function(e) {
    e.preventDefault();
    // Replace with your Google Form/Typeform URL
    if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.create({url: 'https://forms.google.com/your-form-url'});
    }
});

// Rate extension
document.getElementById('rateExtension').addEventListener('click', function(e) {
    e.preventDefault();
    // Replace with your Chrome Web Store URL
    if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.create({url: 'https://chrome.google.com/webstore/detail/your-extension-id'});
    }
});

// Share functionality
document.getElementById('shareButton').addEventListener('click', function () {
    const shareOptions = document.getElementById('shareOptions');
    if (shareOptions.style.display === 'none') {
        shareOptions.style.display = 'block';
        this.innerHTML = '📤 Close sharing options';
    } else {
        shareOptions.style.display = 'none';
        this.innerHTML = '<span>📤</span> Share HyperConverter';
    }
});

// Share on Twitter/X
document.getElementById('shareTwitter').addEventListener('click', function(e) {
    e.preventDefault();
    const text = encodeURIComponent('Just discovered HyperConverter - instantly converts measurements on any website! 🔄 Perfect for international shopping and cooking. #productivity #chrome');
    if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.create({url: `https://twitter.com/intent/tweet?text=${text}`});
    } else {
        window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
    }
});

// Share on Reddit
document.getElementById('shareReddit').addEventListener('click', function(e) {
    e.preventDefault();
    const title = encodeURIComponent('HyperConverter - Universal measurement conversion Chrome extension');
    const text = encodeURIComponent('This extension automatically detects and converts measurements on websites. Perfect for international users dealing with different unit systems!');
    if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.create({url: `https://reddit.com/submit?title=${title}&text=${text}`});
    } else {
        window.open(`https://reddit.com/submit?title=${title}&text=${text}`, '_blank');
    }
});

// Copy link
document.getElementById('copyLink').addEventListener('click', function() {
    const extensionUrl = 'https://chrome.google.com/webstore/detail/your-extension-id'; // Replace with your actual URL
    navigator.clipboard.writeText(extensionUrl).then(function() {
        const originalText = this.innerHTML;
        this.innerHTML = '<span>✅</span> Copied!';
        setTimeout(() => {
            this.innerHTML = '<span>🔗</span> Copy Link';
        }, 2000);
    }.bind(this)).catch(function() {
        alert('Link copied to clipboard!'); // Fallback
    });
});

// Author link
document.getElementById('authorLink').addEventListener('click', function(e) {
    e.preventDefault();
    // Replace with your website/social media
    if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.create({url: 'https://your-website.com'});
    }
});