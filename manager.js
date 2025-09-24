document.addEventListener('DOMContentLoaded', function() {
    const blacklistUl = document.getElementById('blacklist');
    let blacklistedSites = [];

    // Function to render the list of blacklisted sites
    function renderBlacklist() {
        // Clear the list first to prevent duplicates
        blacklistUl.innerHTML = '';

        if (blacklistedSites.length === 0) {
            blacklistUl.innerHTML = '<li>No sites blocked yet.</li>';
            return;
        }

        blacklistedSites.forEach(site => {
            const li = document.createElement('li');

            // Create the checkbox
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = true; // They are blacklisted, so they should be checked
            checkbox.dataset.site = site; // Store the site domain in the checkbox data

            // Create the label for the site domain
            const label = document.createElement('span');
            label.className = 'site-label';
            label.textContent = site;
            
            li.appendChild(checkbox);
            li.appendChild(label);
            blacklistUl.appendChild(li);
        });
    }

    // Function to handle removing a site from the blacklist
    function removeSiteFromBlacklist(site) {
        // Ask for confirmation
        const confirmation = confirm(`Remove ${site} from the blacklist?`);
        
        if (confirmation) {
            // Filter the array to remove the site
            blacklistedSites = blacklistedSites.filter(s => s !== site);
            
            // Save the updated list to storage
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.sync.set({ blacklistedSites: blacklistedSites }, function() {
                    console.log(`${site} has been removed from the blacklist.`);
                    // Re-render the list to show the change
                    renderBlacklist();
                });
            }
        }
    }

    // Event listener for the blacklist container
    // This uses "event delegation" to listen for clicks on checkboxes
    blacklistUl.addEventListener('click', function(e) {
        // Check if the clicked element is a checkbox and is being unchecked
        if (e.target.type === 'checkbox' && !e.target.checked) {
            const site = e.target.dataset.site;
            removeSiteFromBlacklist(site);
            // We prevent the checkbox from visually unchecking immediately.
            // It will only uncheck if the user confirms and the list is re-rendered.
            e.preventDefault(); 
        }
    });

    // Load the initial list of blacklisted sites from storage
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.get(['blacklistedSites'], function(result) {
            blacklistedSites = result.blacklistedSites || [];
            renderBlacklist();
        });
    } else {
        // For previewing the HTML without the extension API
        blacklistedSites = ['example.com', 'anothersite.org'];
        renderBlacklist();
    }
    const newSiteInput = document.getElementById('newSiteInput');
    const addSiteButton = document.getElementById('addSiteButton');

    // Function to handle adding a new site to the blacklist
    function addNewSite() {
        // 1. Get the value from the input field and trim whitespace.
        let newSite = newSiteInput.value.trim();
        if (!newSite) {
            // Do nothing if the input is empty.
            return;
        }

        // 2. Basic validation: try to extract a valid hostname.
        // This handles cases where users paste full URLs.
        try {
            // Prepend a protocol if one isn't there, so we can use the URL object.
            if (!newSite.startsWith('http')) {
                newSite = 'https://' + newSite;
            }
            const url = new URL(newSite);
            newSite = url.hostname; 
        } catch (error) {
            // If the URL is invalid, alert the user and stop.
            alert('Please enter a valid domain name (e.g., example.com)');
            return;
        }

        // 3. Check if the site is already in the blacklist.
        if (blacklistedSites.includes(newSite)) {
            alert(`${newSite} is already on the blacklist.`);
            return;
        }

        // 4. Add the new site to our array.
        blacklistedSites.push(newSite);

        // 5. Save the updated array to storage.
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.sync.set({ blacklistedSites: blacklistedSites }, function() {
                console.log(`${newSite} has been added to the blacklist.`);
                // Clear the input field and re-render the list.
                newSiteInput.value = '';
                renderBlacklist();
            });
        }
    }

    // Add event listener for the "Block" button.
    addSiteButton.addEventListener('click', addNewSite);

    // Also allow pressing "Enter" in the input field.
    newSiteInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addNewSite();
        }
    });
});