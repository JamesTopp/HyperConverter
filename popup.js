// Extension toggle functionality
let extensionEnabled = true;
let globallyDisabled = false;
let blacklistedSites = [];
let currentDomain = '';
let userConversions = 0;

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
    return blacklistedSites.some(site =>
        currentDomain === site || currentDomain.endsWith('.' + site)
    );
}

// Load conversion count and update display
function loadConversionCount() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['conversionCount'], function(result) {
            userConversions = result.conversionCount || 0;
            document.getElementById('userConversions').textContent = userConversions.toLocaleString();
        });
    } else {
        // For preview
        userConversions = 847;
        document.getElementById('userConversions').textContent = userConversions.toLocaleString();
    }
}

// Blacklist management functions
function renderBlacklist() {
    const blacklistList = document.getElementById('blacklistList');
    blacklistList.innerHTML = '';

    if (blacklistedSites.length === 0) {
        blacklistList.innerHTML = '<li class="blacklist-item empty">No sites blocked yet.</li>';
        return;
    }

    blacklistedSites.forEach(site => {
        const li = document.createElement('li');
        li.className = 'blacklist-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'site-checkbox';
        checkbox.checked = true;
        checkbox.dataset.site = site;

        const label = document.createElement('span');
        label.className = 'site-label';
        label.textContent = site;
        
        li.appendChild(checkbox);
        li.appendChild(label);
        blacklistList.appendChild(li);
    });
}

function removeSiteFromBlacklist(site) {
    const confirmation = confirm(`Remove ${site} from the blacklist?`);
    
    if (confirmation) {
        blacklistedSites = blacklistedSites.filter(s => s !== site);
        
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.sync.set({ blacklistedSites: blacklistedSites }, function() {
                console.log(`${site} has been removed from the blacklist.`);
                renderBlacklist();
                updateToggleUI();
            });
        }
    }
}

function addNewSite() {
    const newSiteInput = document.getElementById('newSiteInput');
    let newSite = newSiteInput.value.trim();
    
    if (!newSite) {
        return;
    }

    try {
        if (!newSite.startsWith('http')) {
            newSite = 'https://' + newSite;
        }
        const url = new URL(newSite);
        newSite = url.hostname; 
    } catch (error) {
        alert('Please enter a valid domain name (e.g., example.com)');
        return;
    }

    if (blacklistedSites.includes(newSite)) {
        alert(`${newSite} is already on the blacklist.`);
        return;
    }

    blacklistedSites.push(newSite);

    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.set({ blacklistedSites: blacklistedSites }, function() {
            console.log(`${newSite} has been added to the blacklist.`);
            newSiteInput.value = '';
            renderBlacklist();
            updateToggleUI();
        });
    }
}

// Main toggle functionality
document.getElementById('extensionToggle').addEventListener('click', function() {
    if (globallyDisabled) {
        return;
    } 
    
    // SIMPLIFIED: If site is blacklisted, make toggle non-interactive
    if (isCurrentSiteBlacklisted()) {
        return;
    }
    
    extensionEnabled = !extensionEnabled;
    
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.set({enabled: extensionEnabled});
    }
    
    updateToggleUI();
});

document.getElementById('neverRunButton').addEventListener('click', function() {
    if (currentDomain && !blacklistedSites.includes(currentDomain)) {
        blacklistedSites.push(currentDomain);
        extensionEnabled = false;
        this.textContent = `🚫 Disabled on ${currentDomain}`;
        this.style.opacity = '0.6';
        this.style.cursor = 'default';
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.sync.set({blacklistedSites: blacklistedSites, enabled: false});
        }
        renderBlacklist(); // Update the accordion list
        updateToggleUI();
    }
});

document.getElementById('disableAllPages').addEventListener('click', function() {
    if (globallyDisabled) {
        globallyDisabled = false;
        this.textContent = '🔴 Turn off extension';
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.sync.set({globallyDisabled: false});
        }
    } else {
        globallyDisabled = true;
        this.textContent = '🟢 Turn on extension';
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.sync.set({globallyDisabled: true});
        }
    }
    updateToggleUI();
});

// Accordion toggle functionality
document.getElementById('manageBlacklist').addEventListener('click', function() {
    const blacklistSection = document.getElementById('blacklistSection');
    const gearButton = document.getElementById('gearButton');
    
    if (blacklistSection.classList.contains('show')) {
        blacklistSection.classList.remove('show');
        this.textContent = '⚙️ Manage blocked sites';
    } else {
        blacklistSection.classList.add('show');
        this.textContent = '✕ Close';
        renderBlacklist(); // Refresh the list when opening
    }
});

document.getElementById('gearButton').addEventListener('click', function() {
    const blacklistSection = document.getElementById('blacklistSection');
    const manageButton = document.getElementById('manageBlacklist');
    
    if (blacklistSection.classList.contains('show')) {
        blacklistSection.classList.remove('show');
        manageButton.textContent = '⚙️ Manage blocked sites';
    } else {
        blacklistSection.classList.add('show');
        manageButton.textContent = '✕ Close';
        renderBlacklist();
    }
});

// Blacklist event listeners
document.getElementById('blacklistList').addEventListener('click', function(e) {
    if (e.target.type === 'checkbox' && !e.target.checked) {
        const site = e.target.dataset.site;
        removeSiteFromBlacklist(site);
        e.preventDefault(); 
    }
});

document.getElementById('addSiteButton').addEventListener('click', addNewSite);

document.getElementById('newSiteInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addNewSite();
    }
});

function updateToggleUI() {
    const toggleSwitch = document.getElementById('toggleSwitch');
    const statusText = document.getElementById('statusText');
    const disableOptions = document.getElementById('disableOptions');
    const gearButton = document.getElementById('gearButton');
    const extensionToggle = document.getElementById('extensionToggle');
    const neverRunButton = document.getElementById('neverRunButton');

    if (globallyDisabled) {
        toggleSwitch.classList.remove('active');
        statusText.textContent = 'Extension is off';
        disableOptions.style.display = 'block';
        gearButton.style.display = 'none';
        extensionToggle.style.opacity = '0.5';
        extensionToggle.style.cursor = 'not-allowed';
        extensionToggle.style.pointerEvents = 'none';
        document.getElementById('disableAllPages').textContent = '🟢 Turn on extension';
    } else if (isCurrentSiteBlacklisted()) {
        // SIMPLIFIED: Make toggle non-interactive for blacklisted sites
        toggleSwitch.classList.remove('active');
        statusText.textContent = `Disabled on ${currentDomain}`;
        disableOptions.style.display = 'block';
        gearButton.style.display = 'none';
        extensionToggle.style.opacity = '0.6';
        extensionToggle.style.cursor = 'not-allowed';
        extensionToggle.style.pointerEvents = 'none';
        document.getElementById('disableAllPages').textContent = '🔴 Turn off extension';

        neverRunButton.textContent = `🚫 Disabled on ${currentDomain}`;
        neverRunButton.style.opacity = '0.6';
        neverRunButton.style.cursor = 'default';

    } else if (extensionEnabled) {
        toggleSwitch.classList.add('active');
        statusText.textContent = 'Active on this page';
        disableOptions.style.display = 'none';
        gearButton.style.display = 'inline-block';
        extensionToggle.style.opacity = '1';
        extensionToggle.style.cursor = 'pointer';
        extensionToggle.style.pointerEvents = 'auto';
        document.getElementById('disableAllPages').textContent = '🔴 Turn off extension';

        neverRunButton.textContent = '🚫 Never run on this page?';
        neverRunButton.style.opacity = '1';
        neverRunButton.style.cursor = 'pointer';

    } else {
        toggleSwitch.classList.remove('active');
        statusText.textContent = 'Disabled on this page';
        disableOptions.style.display = 'block';
        gearButton.style.display = 'none';
        extensionToggle.style.opacity = '1';
        extensionToggle.style.cursor = 'pointer';
        extensionToggle.style.pointerEvents = 'auto';
        document.getElementById('disableAllPages').textContent = '🔴 Turn off extension';

        neverRunButton.textContent = '🚫 Never run on this page?';
        neverRunButton.style.opacity = '1';
        neverRunButton.style.cursor = 'pointer';
    }
}

// Load current state when popup opens
if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.sync.get(['enabled', 'globallyDisabled', 'blacklistedSites'], function(result) {
        extensionEnabled = result.enabled !== false;
        globallyDisabled = result.globallyDisabled || false;
        blacklistedSites = result.blacklistedSites || [];
        getCurrentDomain();
        loadConversionCount(); // Load the user's conversion count
    });
} else {
    // For preview - just set initial state
    getCurrentDomain();
    loadConversionCount();
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

// Update your existing emailSubmit event listener in popup.js
emailSubmit.addEventListener('click', async function() {
    const email = emailInput.value;
    if (email && validateEmail(email)) {
        // Show loading state
        emailSubmit.disabled = true;
        emailButtonText.style.display = 'none';
        emailSpinner.style.display = 'block';
        emailValidation.classList.remove('show');
        
        try {
            // Send email to Google Apps Script
            const response = await fetch('https://script.google.com/macros/s/AKfycbxFp8erY5S5qfeEBPL-U3nAnn7NjP4CTuzFFzbCfTSuiM66oezNQRP4xC7nSbDScufL/exec', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: email })
            });
            
            const result = await response.json();
            
            if (result.success) {
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
                
                console.log('Email successfully added to list');
            } else {
                // Handle errors (duplicate email, etc.)
                emailSpinner.style.display = 'none';
                emailButtonText.style.display = 'block';
                emailSubmit.disabled = false;
                
                if (result.message === 'Email already subscribed') {
                    alert('This email is already on our list!');
                } else {
                    alert('There was an error. Please try again.');
                }
            }
        } catch (error) {
            // Handle network errors
            console.error('Email submission error:', error);
            emailSpinner.style.display = 'none';
            emailButtonText.style.display = 'block';
            emailSubmit.disabled = false;
            alert('Network error. Please check your connection and try again.');
        }
    } else {
        alert('Please enter a valid email address');
    }
});

// Feature suggestion
document.getElementById('suggestFeature').addEventListener('click', function(e) {
    e.preventDefault();
    // Replace with your Google Form/Typeform URL
    if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.create({url: 'https://forms.gle/6wS2ejuUCKebcEa97'});
    }
});

// Rate extension
document.getElementById('rateExtension').addEventListener('click', function(e) {
    e.preventDefault();
    // Replace with your Chrome Web Store URL
    if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.create({url: 'https://chromewebstore.google.com/detail/hyperconverter/gfjpkobijpblaciddplfhnooinabjkkj'});
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
        chrome.tabs.create({url: 'https://jamestopp.github.io/'});
    }
});

// Listen for messages from the popup script.
if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        // If the message is to reload, refresh the page.
        if (request.action === "reloadPage") {
            window.location.reload();
        }
    });
}