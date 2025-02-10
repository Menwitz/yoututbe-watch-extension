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
  
  // This function scans all open tabs, filters YouTube watch pages, and updates the watch list.
  function updateWatchList() {
    chrome.tabs.query({}, (tabs) => {
      let newList = [];
      tabs.forEach(tab => {
        if (tab.url && tab.url.includes("youtube.com/watch")) {
          let videoId = getVideoId(tab.url);
          if (videoId) {
            newList.push({
              tabId: tab.id,                        // Unique tab identifier.
              videoId: videoId,                     // YouTube video ID.
              title: tab.title,                     // The tab title.
              url: tab.url,                         // The full URL.
              thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`, // Thumbnail URL.
              timestamp: Date.now()                 // Time added.
            });
          }
        }
      });
      // Update the watch list in Chrome's local storage.
      chrome.storage.local.set({ watchList: newList });
    });
  }
  
  // Listen for tab updates and add new YouTube watch pages.
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes("youtube.com/watch")) {
      updateWatchList();
    }
  });
  
  // Listen for tab removals to update the watch list accordingly.
  chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    updateWatchList();
  });
  
  // Handle messages from the content script (e.g., marking a video as watched).
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "markAsWatched") {
      // Remove the video with the provided videoId from the watch list.
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
    // Ensure the tab has a URL where content scripts are injected (e.g., http or https).
    if (!tab.url || !(tab.url.startsWith("http://") || tab.url.startsWith("https://"))) {
      console.log("The active tab is not a valid webpage for our content script.");
      return;
    }
    // Send a message to the active tab's content script to toggle the sidebar.
    chrome.tabs.sendMessage(tab.id, { action: "toggleSidebar" }, (response) => {
      // If the content script is not present, log the error and continue gracefully.
      if (chrome.runtime.lastError) {
        console.error("Error sending message:", chrome.runtime.lastError.message);
      }
    });
  });
  