$(document).ready(function () {
    var feedURL = 'https://gdata.youtube.com/feeds/api/';
    var jsonUrl;

    getPlaylists();

    function getPlaylists() {
        jsonURL = feedURL + 'users/stihlusa/playlists?v=2&alt=json&callback=showMyVideos&format=5';

        $.getJSON(jsonURL);
    }
});