// background.js

// Helper function to extract the YouTube video ID from a URL.
function getVideoId(url) {
  try {
    let urlObj = new URL(url);
    return urlObj.searchParams.get("v");
  } catch (e) {
    return null;
  }
}

// Function to scan all open tabs for YouTube watch pages and update the watch list.
function updateWatchList() {
  chrome.tabs.query({}, (tabs) => {
    let newList = [];
    tabs.forEach(tab => {
      if (tab.url && tab.url.includes("youtube.com/watch")) {
        let videoId = getVideoId(tab.url);
        if (videoId) {
          newList.push({
            tabId: tab.id,
            videoId: videoId,
            title: tab.title,
            url: tab.url,
            thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            timestamp: Date.now()
          });
        }
      }
    });
    chrome.storage.local.set({ watchList: newList });
  });
}

// Listen for tab updates.
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes("youtube.com/watch")) {
    updateWatchList();
  }
});

// Listen for tab removals.
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  updateWatchList();
});

// Handle messages from the content script (e.g., marking a video as watched).
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "markAsWatched") {
    chrome.storage.local.get({ watchList: [] }, (result) => {
      let updatedList = result.watchList.filter(video => video.videoId !== message.videoId);
      chrome.storage.local.set({ watchList: updatedList }, () => {
        sendResponse({ status: "success" });
      });
    });
    return true; // Indicate asynchronous response.
  }
});

// Listen for the extension button click to toggle the sidebar.
chrome.action.onClicked.addListener((tab) => {
  console.log("Extension button clicked on tab:", tab.id, "URL:", tab.url);
  // Only proceed if the tab URL starts with http or https.
  if (!tab.url || !(tab.url.startsWith("http://") || tab.url.startsWith("https://"))) {
    console.log("Active tab does not support content scripts:", tab.url);
    return;
  }

  // Attempt to send the toggle message to the content script.
  chrome.tabs.sendMessage(tab.id, { action: "toggleSidebar" }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("Error sending toggleSidebar message:", chrome.runtime.lastError.message);
      // Dynamically inject the content script and then resend the toggle message.
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"]
      }, () => {
        // Wait a brief moment to ensure the content script is loaded.
        setTimeout(() => {
          chrome.tabs.sendMessage(tab.id, { action: "toggleSidebar" }, (response) => {
            if (chrome.runtime.lastError) {
              console.error("Error after injecting content script:", chrome.runtime.lastError.message);
            } else {
              console.log("Toggle message sent successfully after injection. Response:", response);
            }
          });
        }, 100);
      });
    } else {
      console.log("Toggle message sent successfully. Response:", response);
    }
  });
});
