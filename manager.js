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
});