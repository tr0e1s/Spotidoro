let musicStatus = 'Stopped';

// Pomodoro

const timer = {
    pomodoro: 1,
    shortBreak: 1,
};
  
let interval;

const deviceSection = document.getElementById('deviceSection');

const mainButton = document.getElementById('js-btn');
mainButton.addEventListener('click', () => {
    const { action } = mainButton.dataset;
    if (action === 'start') {
        startTimer();
    } else {
        stopTimer();
    }
    console.log("Hiding device section");
    deviceSection.classList.add('hidden');
});
  
const modeButtons = document.querySelector('#js-mode-buttons');
modeButtons.addEventListener('click', handleMode);
  
function getRemainingTime(endTime) {
    const currentTime = Date.parse(new Date());
    const difference = endTime - currentTime;
  
    const total = Number.parseInt(difference / 1000, 10);
    const minutes = Number.parseInt((total / 60) % 60, 10);
    const seconds = Number.parseInt(total % 60, 10);
  
    return {
        total,
        minutes,
        seconds,
    };
}
  
function startTimer() {
    
    if (timer.mode === 'pomodoro') {
        playMusic();
    }

    let { total } = timer.remainingTime;
    const endTime = Date.parse(new Date()) + total * 1000;
  
    mainButton.dataset.action = 'stop';
    mainButton.textContent = 'pause timer';
    mainButton.classList.add('active');
  
    interval = setInterval(function() {
        timer.remainingTime = getRemainingTime(endTime);
        updateClock();
  
        total = timer.remainingTime.total;
        if (total <= 0) {
            clearInterval(interval);
    
            switch (timer.mode) {
                case 'pomodoro':
                    switchMode('shortBreak');
                    pauseMusic();
                    break;
                default:
                    switchMode('pomodoro');
                    playMusic();
            }
    
            startTimer();
        }
    }, 1000);
}
  
function stopTimer() {
    clearInterval(interval);
  
    mainButton.dataset.action = 'start';
    mainButton.textContent = 'start timer';
    mainButton.classList.remove('active');

    pauseMusic();
}
  
function updateClock() {
    const { remainingTime } = timer;
    const minutes = `${remainingTime.minutes}`.padStart(2, '0');
    const seconds = `${remainingTime.seconds}`.padStart(2, '0');
  
    const min = document.getElementById('js-minutes');
    const sec = document.getElementById('js-seconds');
    min.textContent = minutes;
    sec.textContent = seconds;

    const text = timer.mode === 'pomodoro' ? 'Focus' : 'Break';
    document.title = `${text} - ${minutes}:${seconds} - Spotidoro`;
  
}
  
function switchMode(mode) {
    timer.mode = mode;
    timer.remainingTime = {
        total: timer[mode] * 60,
        minutes: timer[mode],
        seconds: 0,
    };
  
    document
        .querySelectorAll('button[data-mode]')
        .forEach(e => e.classList.remove('active'));
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
    document.body.style.backgroundColor = `var(--${mode})`;
  
    updateClock();
}
  
function handleMode(event) {
    const { mode } = event.target.dataset;
  
    if (!mode) return;
  
    switchMode(mode);
    stopTimer();
}
  
document.addEventListener('DOMContentLoaded', () => {
    switchMode('pomodoro');
});

// Glue code

function playMusic(){
    if (musicStatus === 'Stopped'){
        console.log("Starting new playback");
        startNewPlayback();
        musicStatus = 'Playing';
    } else if (musicStatus === 'Paused'){
        console.log("Resuming playback");
        resume();
        musicStatus = 'Playing';
    }
}

function pauseMusic(){
    if (musicStatus === 'Playing'){
        console.log('Pausing music');
        pause();
        musicStatus = 'Paused';
    }
}

// Spotify

var redirect_uri = "http://127.0.0.1:5500/index.html";
 
var client_id = ""; 
var client_secret = "";

var access_token = null;
var refresh_token = null;
var currentPlaylist = "";

const AUTHORIZE = "https://accounts.spotify.com/authorize"
const TOKEN = "https://accounts.spotify.com/api/token";
const PLAYLISTS = "https://api.spotify.com/v1/me/playlists";
const DEVICES = "https://api.spotify.com/v1/me/player/devices";
const PLAY = "https://api.spotify.com/v1/me/player/play";
const PAUSE = "https://api.spotify.com/v1/me/player/pause";
const NEXT = "https://api.spotify.com/v1/me/player/next";
const PREVIOUS = "https://api.spotify.com/v1/me/player/previous";
const PLAYER = "https://api.spotify.com/v1/me/player";
const TRACKS = "https://api.spotify.com/v1/playlists/{{PlaylistId}}/tracks";
const CURRENTLYPLAYING = "https://api.spotify.com/v1/me/player/currently-playing";
const SHUFFLE = "https://api.spotify.com/v1/me/player/shuffle";

function onPageLoad(){
    client_id = localStorage.getItem("client_id");
    client_secret = localStorage.getItem("client_secret");
    if ( window.location.search.length > 0 ){
        handleRedirect();
    }
    else{
        access_token = localStorage.getItem("access_token");
        if ( access_token == null ){
            // we don't have an access token so present token section
            document.getElementById("tokenSection").style.display = 'block';  
        }
        else {
            // we have an access token so present device section
            document.getElementById("deviceSection").style.display = 'block';  
            refreshDevices();
            refreshPlaylists();
            currentlyPlaying();
            playbackStatus();
        }
    }
}

function handleRedirect(){
    let code = getCode();
    fetchAccessToken( code );
    window.history.pushState("", "", redirect_uri); // remove param from url
}

function getCode(){
    let code = null;
    const queryString = window.location.search;
    if ( queryString.length > 0 ){
        const urlParams = new URLSearchParams(queryString);
        code = urlParams.get('code')
    }
    return code;
}

function requestAuthorization(){
    client_id = document.getElementById("clientId").value;
    client_secret = document.getElementById("clientSecret").value;
    localStorage.setItem("client_id", client_id);
    localStorage.setItem("client_secret", client_secret); // In a real app you should not expose your client_secret to the user

    let url = AUTHORIZE;
    url += "?client_id=" + client_id;
    url += "&response_type=code";
    url += "&redirect_uri=" + encodeURI(redirect_uri);
    url += "&show_dialog=true";
    url += "&scope=user-read-private user-read-email user-modify-playback-state user-read-playback-position user-library-read streaming user-read-playback-state user-read-recently-played playlist-read-private";
    window.location.href = url; // Show Spotify's authorization screen
}

function fetchAccessToken( code ){
    let body = "grant_type=authorization_code";
    body += "&code=" + code; 
    body += "&redirect_uri=" + encodeURI(redirect_uri);
    body += "&client_id=" + client_id;
    body += "&client_secret=" + client_secret;
    callAuthorizationApi(body);
}

function refreshAccessToken(){
    refresh_token = localStorage.getItem("refresh_token");
    let body = "grant_type=refresh_token";
    body += "&refresh_token=" + refresh_token;
    body += "&client_id=" + client_id;
    callAuthorizationApi(body);
}

function callAuthorizationApi(body){
    let xhr = new XMLHttpRequest();
    xhr.open("POST", TOKEN, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(client_id + ":" + client_secret));
    xhr.send(body);
    xhr.onload = handleAuthorizationResponse;
}

function handleAuthorizationResponse(){
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        console.log(data);
        var data = JSON.parse(this.responseText);
        if ( data.access_token != undefined ){
            access_token = data.access_token;
            localStorage.setItem("access_token", access_token);
        }
        if ( data.refresh_token  != undefined ){
            refresh_token = data.refresh_token;
            localStorage.setItem("refresh_token", refresh_token);
        }
        onPageLoad();
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function refreshDevices(){
    callApi( "GET", DEVICES, null, handleDevicesResponse );
}

function handleDevicesResponse(){
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        console.log(data);
        removeAllItems( "devices" );
        data.devices.forEach(item => addDevice(item));
    }
    else if ( this.status == 401 ){
        refreshAccessToken()
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function addDevice(item){
    let node = document.createElement("option");
    node.value = item.id;
    node.innerHTML = item.name;
    document.getElementById("devices").appendChild(node); 
}

function callApi(method, url, body, callback){
    let xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
    xhr.send(body);
    xhr.onload = callback;
}

function refreshPlaylists(){
    callApi( "GET", PLAYLISTS, null, handlePlaylistsResponse );
}

function handlePlaylistsResponse(){
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        console.log(data);
        removeAllItems( "playlists" );
        data.items.forEach(item => addPlaylist(item));
        document.getElementById('playlists').value=currentPlaylist;
    }
    else if ( this.status == 401 ){
        refreshAccessToken()
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function addPlaylist(item){
    let node = document.createElement("option");
    node.value = item.id;
    node.innerHTML = item.name + " (" + item.tracks.total + ")";
    document.getElementById("playlists").appendChild(node); 
}

function removeAllItems( elementId ){
    let node = document.getElementById(elementId);
    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }
}

function resume(){
    callApi( "PUT", PLAY + "?device_id=" + deviceId(), null, handleApiResponse );
}

function startNewPlayback(){
    let playlist_id = document.getElementById("playlists").value;
    let body = {};
    body.context_uri = "spotify:playlist:" + playlist_id;
    body.offset = {};
    body.offset.position = 0;
    body.offset.position_ms = 0;
    callApi( "PUT", PLAY + "?device_id=" + deviceId(), JSON.stringify(body), handleApiResponse );
}

function shuffle(){
    callApi( "PUT", SHUFFLE + "?state=true&device_id=" + deviceId(), null, handleApiResponse );
    play(); 
}

function pause(){
    callApi( "PUT", PAUSE + "?device_id=" + deviceId(), null, handleApiResponse );
}

function next(){
    callApi( "POST", NEXT + "?device_id=" + deviceId(), null, handleApiResponse );
}

function previous(){
    callApi( "POST", PREVIOUS + "?device_id=" + deviceId(), null, handleApiResponse );
}

function transfer(){
    let body = {};
    body.device_ids = [];
    body.device_ids.push(deviceId())
    callApi( "PUT", PLAYER, JSON.stringify(body), handleApiResponse );
}

function handleApiResponse(){
    if ( this.status == 200){
        console.log(this.responseText);
        setTimeout(currentlyPlaying, 2000);
    }
    else if ( this.status == 204 ){
        setTimeout(currentlyPlaying, 2000);
    }
    else if ( this.status == 401 ){
        refreshAccessToken()
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }    
}

function deviceId(){
    return document.getElementById("devices").value;
}

function fetchTracks(){
    let playlist_id = document.getElementById("playlists").value;
    if ( playlist_id.length > 0 ){
        url = TRACKS.replace("{{PlaylistId}}", playlist_id);
        callApi( "GET", url, null, handleTracksResponse );
    }
}

function handleTracksResponse(){
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        console.log(data);
        removeAllItems( "tracks" );
        data.items.forEach( (item, index) => addTrack(item, index));
    }
    else if ( this.status == 401 ){
        refreshAccessToken()
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function addTrack(item, index){
    let node = document.createElement("option");
    node.value = index;
    node.innerHTML = item.track.name + " (" + item.track.artists[0].name + ")";
    document.getElementById("tracks").appendChild(node); 
}

function currentlyPlaying(){
    callApi( "GET", PLAYER, null, handleCurrentlyPlayingResponse );
}

function handleCurrentlyPlayingResponse(){
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        console.log(data);
        if ( data.item != null ){
            document.getElementById("albumImage").src = data.item.album.images[0].url;
            document.getElementById("trackTitle").innerHTML = data.item.name;
            document.getElementById("trackArtist").innerHTML = data.item.artists[0].name;
        }


        if ( data.device != null ){
            // select device
            currentDevice = data.device.id;
            document.getElementById('devices').value=currentDevice;
        }

        if ( data.context != null ){
            // select playlist
            currentPlaylist = data.context.uri;
            currentPlaylist = currentPlaylist.substring( currentPlaylist.lastIndexOf(":") + 1,  currentPlaylist.length );
            document.getElementById('playlists').value=currentPlaylist;
        }
    }
    else if ( this.status == 204 ){

    }
    else if ( this.status == 401 ){
        refreshAccessToken()
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function playbackStatus(){
    callApi( "GET", PLAYER, null, handlePlaybackStatusResponse );
}

function handlePlaybackStatusResponse(){
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        console.log(data);
        
        if (data.is_playing != null){
            console.log(data.is_playing);
            if (data.is_playing == true) {
                pause();
                musicStatus = 'Paused';
            }
        }
    }
    else if ( this.status == 204 ){

    }
    else if ( this.status == 401 ){
        refreshAccessToken()
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

window.onbeforeunload = function(){
    pause();
};