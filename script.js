document.addEventListener("DOMContentLoaded", () => {
  const audio = document.getElementById("audio-player");
  const nowPlaying = document.getElementById("now-playing");
  const status = document.getElementById("player-status");
  const message = document.getElementById("player-message");
  const tracks = document.querySelectorAll(".track");
  const buttons = document.querySelectorAll(".play-button");

  if (!audio || !nowPlaying || !status || !message) {
    console.error("RAZARCHIVE: Audio player elements not found.");
    return;
  }

  let currentTrack = null;

  function updateButtons() {
    tracks.forEach((track) => {
      const button = track.querySelector(".play-button");
      const isCurrent = track === currentTrack;
      const isPlaying = isCurrent && !audio.paused;

      track.classList.toggle("is-playing", isCurrent);
      button.setAttribute("aria-pressed", String(isPlaying));

      button.innerHTML = isPlaying
        ? 'PAUSE <span>Ⅱ</span>'
        : 'PLAY <span>↗</span>';
    });
  }

  async function playTrack(track) {
    const file = track.dataset.file;
    const title = track.querySelector("h3").textContent;
    const source = new URL(`./audio/${file}`, document.baseURI).href;

    if (currentTrack === track && !audio.paused) {
      audio.pause();
      return;
    }

    if (currentTrack !== track || audio.src !== source) {
      currentTrack = track;
      audio.src = source;
      audio.load();
    }

    nowPlaying.textContent = title;
    status.textContent = "LOADING";
    status.classList.add("is-active");
    message.textContent = `LOADING AUDIO FILE: ${file}`;

    updateButtons();

    try {
      await audio.play();
      status.textContent = "NOW PLAYING";
      message.textContent = `PLAYING FROM ARCHIVE: ${file}`;
      updateButtons();
    } catch (error) {
      status.textContent = "PLAYBACK ERROR";
      message.textContent =
        `Couldn't play ${file}. Check the filename and audio folder.`;
      updateButtons();
      console.error("RAZARCHIVE audio error:", error);
    }
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const track = button.closest(".track");

      if (track) {
        playTrack(track);
      }
    });
  });

  audio.addEventListener("play", () => {
    status.textContent = "NOW PLAYING";
    status.classList.add("is-active");
    updateButtons();
  });

audio.addEventListener("ended", () => {
  const trackList = Array.from(tracks);
  const currentIndex = trackList.indexOf(currentTrack);
  const nextTrack = trackList[currentIndex + 1];

  if (nextTrack) {
    playTrack(nextTrack);
  } else {
    status.textContent = "PLAYBACK COMPLETE";
    message.textContent = "ALL TRACKS PLAYED. SELECT ANOTHER RECORD.";
    updateButtons();
  }
});

  audio.addEventListener("ended", () => {
    status.textContent = "PLAYBACK COMPLETE";
    message.textContent = "TRACK FINISHED. SELECT ANOTHER RECORD.";
    updateButtons();
  });

  audio.addEventListener("error", () => {
    if (audio.currentSrc) {
      status.textContent = "FILE UNAVAILABLE";
      message.textContent =
        "Audio could not be loaded. Verify the MP3 file in the audio folder.";
    }
  });

  console.log(`RAZARCHIVE ready: ${tracks.length} tracks detected.`);
});
