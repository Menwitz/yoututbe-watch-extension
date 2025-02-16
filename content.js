// content.js

(function() {
  // Create the main container for the sidebar.
  const panel = document.createElement('div');
  panel.id = 'yt-watchlist-panel';
  panel.style.cssText = `
    position: fixed;
    top: 0;
    right: 0;
    width: 320px;
    height: 100%;
    background: #f9f9f9;
    border-left: 1px solid #ccc;
    z-index: 999999;
    overflow-y: auto;
    font-family: sans-serif;
    box-shadow: -2px 0 5px rgba(0,0,0,0.1);
  `;

  // Create a header with a title and an internal toggle button.
  const header = document.createElement('div');
  header.style.cssText = "background: #333; color: #fff; padding: 10px; font-size: 16px; display: flex; justify-content: space-between; align-items: center;";
  header.innerHTML = `<span>YouTube Watchlist</span><button id="yt-watchlist-toggle" style="background: #555; color: #fff; border: none; padding: 5px 10px; cursor: pointer;">–</button>`;
  panel.appendChild(header);

  // Create a container for the list of videos.
  const listContainer = document.createElement('div');
  listContainer.id = 'yt-watchlist-list';
  panel.appendChild(listContainer);

  // Append the panel to the document body.
  document.body.appendChild(panel);

  // Internal toggle button for collapsing/expanding the video list.
  document.getElementById('yt-watchlist-toggle').addEventListener('click', () => {
    const currentDisplay = window.getComputedStyle(listContainer).display;
    if (currentDisplay === 'none') {
      listContainer.style.display = 'block';
      document.getElementById('yt-watchlist-toggle').innerText = '–';
      console.log("Internal toggle: Showing video list");
    } else {
      listContainer.style.display = 'none';
      document.getElementById('yt-watchlist-toggle').innerText = '+';
      console.log("Internal toggle: Hiding video list");
    }
  });

  // Function to render the watch list.
  function renderWatchList(watchList) {
    listContainer.innerHTML = '';
    if (watchList.length === 0) {
      listContainer.innerHTML = '<p style="padding: 10px; color: #666;">No videos in watchlist.</p>';
      return;
    }
    watchList.forEach(video => {
      const videoDiv = document.createElement('div');
      videoDiv.style.cssText = 'display: flex; align-items: center; padding: 10px; border-bottom: 1px solid #eee;';
      
      // Thumbnail image.
      const thumb = document.createElement('img');
      thumb.src = video.thumbnail;
      thumb.style.cssText = 'width: 80px; height: 45px; object-fit: cover; margin-right: 10px; cursor: pointer;';
      thumb.title = "Open Video";
      thumb.addEventListener('click', () => {
        window.open(video.url, '_blank');
      });
      videoDiv.appendChild(thumb);

      // Container for video info and action.
      const infoDiv = document.createElement('div');
      infoDiv.style.flexGrow = '1';

      // Title element.
      const title = document.createElement('div');
      title.textContent = video.title;
      title.style.cssText = 'font-size: 14px; font-weight: bold; color: #333; cursor: pointer;';
      title.addEventListener('click', () => {
        window.open(video.url, '_blank');
      });
      infoDiv.appendChild(title);

      // "Mark as Watched" button.
      const markBtn = document.createElement('button');
      markBtn.textContent = 'Watched';
      markBtn.style.cssText = 'margin-top: 5px; padding: 3px 6px; font-size: 12px; cursor: pointer;';
      markBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: "markAsWatched", videoId: video.videoId }, (response) => {
          console.log("Marked as watched:", video.videoId, "Response:", response);
        });
      });
      infoDiv.appendChild(markBtn);

      videoDiv.appendChild(infoDiv);
      listContainer.appendChild(videoDiv);
    });
  }

  // Initial fetch and render of the watch list.
  chrome.storage.local.get({ watchList: [] }, (result) => {
    renderWatchList(result.watchList);
    console.log("Initial watch list rendered", result.watchList);
  });

  // Update the UI when the watch list changes.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.watchList) {
      renderWatchList(changes.watchList.newValue);
      console.log("Watch list updated", changes.watchList.newValue);
    }
  });

  // Listen for messages to toggle the sidebar visibility.
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Content script received message:", message);
    if (message.action === "toggleSidebar") {
      const currentDisplay = window.getComputedStyle(panel).display;
      if (currentDisplay === 'none') {
        panel.style.display = 'block';
        console.log("Sidebar shown via extension button");
      } else {
        panel.style.display = 'none';
        console.log("Sidebar hidden via extension button");
      }
      sendResponse({ status: "toggled" });
    }
  });
})();
