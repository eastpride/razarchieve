const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const audio = $("#audioPlayer");
const toast = $("#toast");

let currentTrack = null;
let savedTracks = JSON.parse(localStorage.getItem("razarchive-saved") || "[]");
let toastTimeout;

const tracks = [
  { title: "After the Static", artist: "RAZAR", type: "Original song" },
  { title: "Room Without Windows", artist: "Anonymous", type: "Demo" },
  { title: "Slow Motion City", artist: "RAZAR", type: "Instrumental" },
  { title: "Blue Hour", artist: "RAZAR", type: "Original song" },
  { title: "Things I Never Sent", artist: "Anonymous", type: "Lyrics" },
  { title: "3:17 AM", artist: "RAZAR", type: "Instrumental" },
  { title: "Ghost Notes", artist: "Anonymous", type: "Demo" },
  { title: "No Reply", artist: "RAZAR", type: "Original song" },
  { title: "A Place to Put It", artist: "Anonymous", type: "Lyrics" }
];

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2600);
}

function saveSavedTracks() {
  localStorage.setItem("razarchive-saved", JSON.stringify(savedTracks));
}

function trackKey(title, artist) {
  return `${title}::${artist}`;
}

function isSaved(track) {
  return savedTracks.some(
    item => trackKey(item.title, item.artist) === trackKey(track.title, track.artist)
  );
}

function syncSaveButtons() {
  $$(".save-track").forEach(button => {
    const card = button.closest("[data-title]");
    const title = card?.dataset.title || currentTrack?.title;
    const artist = card?.dataset.artist || currentTrack?.artist;
    if (!title || !artist) return;

    const saved = isSaved({ title, artist });
    button.classList.toggle("saved", saved);
    button.classList.toggle("saved", saved);
    button.setAttribute("aria-pressed", String(saved));

    if (button.classList.contains("row-save") ||
        button.classList.contains("more-button") ||
        button.classList.contains("player-save")) {
      button.textContent = saved ? "♥" : "♡";
    }
  });
}

function selectTrack(track) {
  currentTrack = track;
  $("#playerTitle").textContent = track.title;
  $("#playerArtist").textContent = `${track.artist} · ${track.type}`;
  $("#mainPlay").textContent = "▶";
  $("#progressFill").style.width = "0%";
  $("#currentTime").textContent = "0:00";
  $("#totalTime").textContent = "--:--";

  // No audio source is assigned until your real music files are added.
  audio.pause();
  audio.removeAttribute("src");
  audio.load();

  syncSaveButtons();
  showToast(`Selected: ${track.title}. Audio file will be connected later.`);
}

function trackFromElement(element) {
  const card = element.closest("[data-title]");
  if (!card) return null;

  return {
    title: card.dataset.title,
    artist: card.dataset.artist || "Unknown artist",
    type: card.dataset.type || "Work"
  };
}

function toggleSaved(track) {
  if (!track) {
    showToast("Choose a work first.");
    return;
  }

  if (isSaved(track)) {
    savedTracks = savedTracks.filter(
      item => trackKey(item.title, item.artist) !== trackKey(track.title, track.artist)
    );
    showToast(`Removed "${track.title}" from Saved.`);
  } else {
    savedTracks.push(track);
    showToast(`Saved "${track.title}".`);
  }

  saveSavedTracks();
  syncSaveButtons();

  if (document.body.dataset.view === "Saved") {
    renderSavedView();
  }
}

function setView(view) {
  document.body.dataset.view = view;
  $("#currentSection").textContent = view.toUpperCase();

  $$(".nav-link, .mobile-nav-link").forEach(button => {
    button.classList.toggle("active", button.dataset.view === view);
  });

  let panel = $("#dynamicPanel");

  if (view === "Discover") {
    panel?.remove();
  } else {
    if (!panel) {
      panel = document.createElement("section");
      panel.id = "dynamicPanel";
      panel.className = "view-panel";
      $(".main-content").prepend(panel);
    }

    if (view === "Search") renderSearchView();
    else if (view === "Saved") renderSavedView();
    else if (view === "The Unheard") renderUnheardView();
    else if (view === "About") renderAboutView();
    else renderArchiveView();
  }

  $("#sidebar").classList.remove("mobile-open");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderArchiveView() {
  $("#dynamicPanel").innerHTML = `
    <div class="eyebrow muted-eyebrow">EVERY SOUND HAS A PLACE</div>
    <h1>The Archive<span class="red-period">.</span></h1>
    <p>A growing collection of originals, demos, instrumentals, lyrics, and unfinished ideas.</p>
    <input class="panel-input" id="archiveSearch" type="search"
      placeholder="Search the archive..." aria-label="Search the archive">
    <div class="filter-row" id="panelFilters">
      <button class="filter-chip selected" data-filter="All">All works</button>
      <button class="filter-chip" data-filter="Original song">Originals</button>
      <button class="filter-chip" data-filter="Demo">Demos</button>
      <button class="filter-chip" data-filter="Instrumental">Instrumentals</button>
      <button class="filter-chip" data-filter="Lyrics">Lyrics</button>
    </div>
    <p class="muted-eyebrow">Browse the sample catalog below.</p>
  `;

  const input = $("#archiveSearch");
  input.addEventListener("input", () => {
    const query = input.value.toLowerCase();
    $$(".archive-row").forEach(row => {
      const matches = row.textContent.toLowerCase().includes(query);
      row.hidden = !matches;
    });
  });

  $("#panelFilters").addEventListener("click", event => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    $$("#panelFilters [data-filter]").forEach(item => {
      item.classList.toggle("selected", item === button);
    });

    const type = button.dataset.filter;
    $$(".archive-row").forEach(row => {
      row.hidden = type !== "All" && row.dataset.type !== type;
    });
  });
}

function renderSearchView() {
  $("#dynamicPanel").innerHTML = `
    <div class="eyebrow muted-eyebrow">FIND SOMETHING THAT SPEAKS TO YOU</div>
    <h1>Search<span class="red-period">.</span></h1>
    <p>Look for a title, artist, or kind of work.</p>
    <input class="panel-input" id="globalSearch" type="search"
      placeholder="Try “Blue Hour” or “Instrumental”..."
      aria-label="Search titles and artists">
    <div id="searchResults" class="saved-list"></div>
  `;

  const input = $("#globalSearch");
  const results = $("#searchResults");

  function updateResults() {
    const query = input.value.trim().toLowerCase();
    if (!query) {
      results.innerHTML = '<p class="saved-empty">Your next discovery starts here.</p>';
      return;
    }

    const matches = tracks.filter(track =>
      `${track.title} ${track.artist} ${track.type}`.toLowerCase().includes(query)
    );

    results.innerHTML = matches.length
      ? matches.map(track => `
        <article class="archive-row">
          <div class="row-art art-red">R/</div>
          <div class="row-main"><h3>${escapeHTML(track.title)}</h3>
            <p>${escapeHTML(track.artist)} · ${escapeHTML(track.type)}</p></div>
          <button class="row-play" data-search-play="${escapeHTML(track.title)}"
            aria-label="Select ${escapeHTML(track.title)}">▶</button>
        </article>`).join("")
      : '<p class="saved-empty">No matching works found.</p>';
  }

  input.addEventListener("input", updateResults);
  results.addEventListener("click", event => {
    const button = event.target.closest("[data-search-play]");
    if (!button) return;
    const track = tracks.find(item => item.title === button.dataset.searchPlay);
    if (track) selectTrack(track);
  });

  updateResults();
}

function renderSavedView() {
  $("#dynamicPanel").innerHTML = `
    <div class="eyebrow muted-eyebrow">YOUR PERSONAL COLLECTION</div>
    <h1>Saved works<span class="red-period">.</span></h1>
    <p>Keep the works you want to come back to. Your saved list stays in this browser.</p>
    <div id="savedResults" class="saved-list"></div>
  `;

  const results = $("#savedResults");

  if (!savedTracks.length) {
    results.innerHTML = '<p class="saved-empty">Nothing saved yet. Tap the ♡ beside a work to keep it here.</p>';
    return;
  }

  results.innerHTML = savedTracks.map(track => `
    <article class="archive-row" data-title="${escapeHTML(track.title)}"
      data-artist="${escapeHTML(track.artist)}" data-type="${escapeHTML(track.type)}">
      <div class="row-art art-red">R/</div>
      <div class="row-main"><h3>${escapeHTML(track.title)}</h3>
        <p>${escapeHTML(track.artist)} · ${escapeHTML(track.type)}</p></div>
      <button class="row-play play-track" aria-label="Select ${escapeHTML(track.title)}">▶</button>
      <button class="row-save save-track" aria-label="Remove ${escapeHTML(track.title)}">♥</button>
    </article>
  `).join("");

  syncSaveButtons();
}

function renderUnheardView() {
  $("#dynamicPanel").innerHTML = `
    <div class="eyebrow muted-eyebrow">A SPACE FOR THE UNHEARD</div>
    <h1>Your work.<br><span class="red-period">Your terms.</span></h1>
    <p>
      Got lyrics in your notes, an instrumental on your phone, a rough demo,
      or a visual idea? This space is being built for creators who want their
      work to be heard without needing to have everything figured out.
    </p>
    <div class="unheard-banner" style="margin-top:28px">
      <div class="banner-symbol">R<span>/</span></div>
      <div>
        <div class="eyebrow">SUBMISSIONS COMING SOON</div>
        <h2>Not ready to share?<br><span>That's okay.</span></h2>
        <p>Submission and permission controls will be added in a later stage.
        Nothing is uploaded or published by this demo.</p>
      </div>
    </div>
  `;
}

function renderAboutView() {
  $("#dynamicPanel").innerHTML = `
    <div class="eyebrow muted-eyebrow">BEHIND THE ARCHIVE</div>
    <h1>About RAZAR<span class="red-period">.</span></h1>
    <p>
      RAZARCHIVE is an independent home for music, ideas, and creative work
      that might otherwise stay hidden. It's a growing archive for things
      that are unfinished, personal, experimental, or simply waiting to be heard.
    </p>
    <p>Some sounds deserve to be found.</p>
  `;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

// Navigation
document.addEventListener("click", event => {
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) {
    event.preventDefault();
    setView(viewButton.dataset.view);
    return;
  }

  const playButton = event.target.closest(".play-track");
  if (playButton) {
    const track = trackFromElement(playButton);
    if (track) selectTrack(track);
    return;
  }

  const saveButton = event.target.closest(".save-track");
  if (saveButton) {
    const track = trackFromElement(saveButton) || currentTrack;
    toggleSaved(track);
  }
});

// Home page category filters
$("#filterRow").addEventListener("click", event => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;

  $$("#filterRow [data-filter]").forEach(item => {
    item.classList.toggle("selected", item === button);
  });

  const type = button.dataset.filter;
  let visibleCount = 0;

  $$(".archive-row").forEach(row => {
    const visible = type === "All" || row.dataset.type === type;
    row.hidden = !visible;
    if (visible) visibleCount++;
  });

  $("#emptyState").hidden = visibleCount !== 0;
});

// Mini-player controls: audio playback becomes active once real files are added.
$("#mainPlay").addEventListener("click", async () => {
  if (!currentTrack) {
    showToast("Choose a work from the archive first.");
    return;
  }

  if (!audio.getAttribute("src")) {
    showToast("Audio isn't connected yet. We'll add your music files next.");
    return;
  }

  try {
    if (audio.paused) {
      await audio.play();
      $("#mainPlay").textContent = "Ⅱ";
    } else {
      audio.pause();
      $("#mainPlay").textContent = "▶";
    }
  } catch {
    showToast("This audio couldn't be played. Check the audio file.");
  }
});

audio.addEventListener("timeupdate", () => {
  if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
  const progress = (audio.currentTime / audio.duration) * 100;
  $("#progressFill").style.width = `${progress}%`;
  $("#currentTime").textContent = formatTime(audio.currentTime);
  $("#totalTime").textContent = formatTime(audio.duration);
});

audio.addEventListener("ended", () => {
  $("#mainPlay").textContent = "▶";
});

audio.addEventListener("pause", () => {
  $("#mainPlay").textContent = "▶";
});

audio.addEventListener("play", () => {
  $("#mainPlay").textContent = "Ⅱ";
});

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remaining}`;
}

$("#previousButton").addEventListener("click", () => {
  moveTrack(-1);
});
$("#nextButton").addEventListener("click", () => {
  moveTrack(1);
});

function moveTrack(direction) {
  if (!currentTrack) {
    showToast("Choose a work first.");
    return;
  }
  const index = tracks.findIndex(item => item.title === currentTrack.title);
  const nextIndex = (index + direction + tracks.length) % tracks.length;
  selectTrack(tracks[nextIndex]);
}

$("#shuffleButton").addEventListener("click", event => {
  event.currentTarget.classList.toggle("enabled");
  showToast("Shuffle control ready for the audio stage.");
});

$("#repeatButton").addEventListener("click", event => {
  event.currentTarget.classList.toggle("enabled");
  showToast("Repeat control ready for the audio stage.");
});

$("#mobileMenu").addEventListener("click", () => {
  showToast("Use the bottom navigation to move around.");
});

// Set the initial screen and button states.
document.body.dataset.view = "Discover";
syncSaveButtons();
