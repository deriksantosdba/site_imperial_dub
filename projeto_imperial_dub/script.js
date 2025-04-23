let playlist = JSON.parse(localStorage.getItem("playlist")) || [];
let currentIndex = 0;
let player;
let videoTitles = JSON.parse(localStorage.getItem("videoTitles")) || {};
let progressInterval;

function onYouTubeIframeAPIReady() {
  player = new YT.Player('playerContainer', {
    height: '0',
    width: '0',
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
}

function onPlayerReady(event) {
  if (playlist.length > 0) {
    playMusic(currentIndex);
  }
  
  document.getElementById('progressBar').addEventListener('input', function() {
    const duration = player.getDuration();
    const seekTime = (this.value / 100) * duration;
    player.seekTo(seekTime, true);
  });
}

function onPlayerStateChange(event) {
  if (event.data == YT.PlayerState.ENDED) {
    playNext();
  }
  
  if (event.data == YT.PlayerState.PLAYING) {
    progressInterval = setInterval(updateProgressBar, 1000);
  } else {
    clearInterval(progressInterval);
  }
  
  updatePlayPauseButton();
}

function updateProgressBar() {
  if (!player || player.getDuration() === 0) return;
  
  const duration = player.getDuration();
  const currentTime = player.getCurrentTime();
  const progress = (currentTime / duration) * 100;
  
  document.getElementById('progressBar').value = progress;
  document.getElementById('currentTime').textContent = formatTime(currentTime);
  document.getElementById('duration').textContent = formatTime(duration);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

async function fetchVideoTitle(videoId) {
  try {
    const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
    const data = await response.json();
    
    if (data.title) {
      videoTitles[videoId] = data.title.length > 30 ? 
        data.title.substring(0, 30) + "..." : 
        data.title;
      localStorage.setItem("videoTitles", JSON.stringify(videoTitles));
      renderPlaylist();
      
      if (currentIndex === playlist.indexOf(videoId)) {
        updateCurrentSongDisplay(videoId);
      }
    }
  } catch (error) {
    console.error("Erro ao buscar título do vídeo:", error);
    videoTitles[videoId] = `Música ${playlist.indexOf(videoId) + 1}`;
  }
}

function addMusic() {
  const link = document.getElementById("youtubeLink").value.trim();
  const videoId = extractVideoId(link);
  
  if (videoId) {
    if (!playlist.includes(videoId)) {
      playlist.push(videoId);
      savePlaylist();
      renderPlaylist();
      
      if (playlist.length === 1) {
        playMusic(0);
      }
      
      fetchVideoTitle(videoId);
    }
    
    document.getElementById("youtubeLink").value = "";
  } else {
    alert("Link do YouTube inválido.");
  }
}

function extractVideoId(url) {
  const regex = /(?:\?v=|\/embed\/|\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function renderPlaylist() {
  const list = document.getElementById("musicList");
  list.innerHTML = "";
  
  playlist.forEach((id, index) => {
    const li = document.createElement("li");
    li.className = "music-item";
    if (index === currentIndex) li.classList.add("playing");
    
    const title = videoTitles[id] || `Música ${index + 1}`;
    
    li.innerHTML = `
      <span>🎵 ${title}</span>
      <div>
        <button onclick="playMusic(${index})">▶</button>
        <button onclick="removeMusic(${index})">🗑</button>
      </div>
    `;
    list.appendChild(li);
  });

  document.getElementById("playerControls").style.display = playlist.length ? "block" : "none";
}

function playMusic(index) {
  if (index >= 0 && index < playlist.length) {
    currentIndex = index;
    const videoId = playlist[currentIndex];
    
    if (player) {
      player.loadVideoById(videoId);
      player.playVideo();
    }
    
    document.getElementById('progressBar').value = 0;
    document.getElementById('currentTime').textContent = "0:00";
    
    updateCurrentSongDisplay(videoId);
    renderPlaylist();
  }
}

function updateCurrentSongDisplay(videoId) {
  const title = videoTitles[videoId] || `Música ${currentIndex + 1}`;
  document.getElementById("currentSong").textContent = `Tocando: ${title}`;
}

function playNext() {
  if (playlist.length === 0) return;
  currentIndex = (currentIndex + 1) % playlist.length;
  playMusic(currentIndex);
}

function playPrev() {
  if (playlist.length === 0) return;
  currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
  playMusic(currentIndex);
}

function togglePlayPause() {
  if (!player) return;
  
  const playerState = player.getPlayerState();
  if (playerState === YT.PlayerState.PLAYING) {
    player.pauseVideo();
  } else {
    player.playVideo();
  }
  
  updatePlayPauseButton();
}

function updatePlayPauseButton() {
  if (!player) return;
  
  const playerState = player.getPlayerState();
  const playPauseBtn = document.getElementById("playPauseBtn");
  
  if (playerState === YT.PlayerState.PLAYING) {
    playPauseBtn.textContent = "⏸ Pausar";
  } else {
    playPauseBtn.textContent = "▶ Reproduzir";
  }
}

function removeMusic(index) {
  if (index >= 0 && index < playlist.length) {
    const videoId = playlist[index];
    playlist.splice(index, 1);
    
    if (!playlist.includes(videoId)) {
      delete videoTitles[videoId];
      localStorage.setItem("videoTitles", JSON.stringify(videoTitles));
    }
    
    savePlaylist();
    
    if (currentIndex > index || currentIndex >= playlist.length) {
      currentIndex = Math.max(0, currentIndex - 1);
    }
    
    renderPlaylist();
    
    if (playlist.length > 0) {
      playMusic(currentIndex);
    } else {
      document.getElementById("playerControls").style.display = "none";
      document.getElementById("currentSong").textContent = "Nenhuma música tocando";
      if (player) player.stopVideo();
    }
  }
}

function savePlaylist() {
  localStorage.setItem("playlist", JSON.stringify(playlist));
}

window.addEventListener('DOMContentLoaded', () => {
  renderPlaylist();
  
  playlist.forEach(videoId => {
    if (!videoTitles[videoId]) {
      fetchVideoTitle(videoId);
    }
  });
});