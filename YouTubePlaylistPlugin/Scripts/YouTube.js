var videoresults;
var displayRatings;

$(document).ready(function () {
    $('body').on('click', '.fancy_video', function (ev) {
        $.fancybox({
            href: this.href,
            type: 'iframe'
        });
        ev.preventDefault();
    });
    $('#playlist').on('click', 'span', function () {
        $('#videos').html('');
        $('iframe').attr('style', 'display: none');
        GetVideos($(this).attr('id'));
    });
});
function GetPlaylists(username, maxresults, maxvideos) {
    if (maxvideos)
        videoresults = maxvideos;
    var feedURL = 'https://gdata.youtube.com/feeds/api/users/';
    var jsonURL = '';

    if (maxresults)
        jsonURL = feedURL + username + '/playlists?v=2&max-results=' + maxresults + '&alt=json';
    else
        jsonURL = feedURL + username + '/playlists?v=2&alt=json';

    $.getJSON(jsonURL, function (data) {
        var playlistIDs = '';
        playlistIDs += '<ul class="bmenu">';
        $.each(data.feed.entry, function (i, item) {
            var newPlaylist = new Playlist(item);
            playlistIDs += newPlaylist.playlistBlock();
        });
        playlistIDs += '</ul>';
        $(playlistIDs).appendTo('#playlist');
    });
}
function GetVideos(playlistID) {
    var feedURL = 'http://gdata.youtube.com/feeds/api/playlists/';
    //var playListURL = 'http://gdata.youtube.com/feeds/api/playlists/' + playlistID + '?v=2&alt=json&callback=?';
    var playListURL = '';

    // use start-index url parameter with max-results for paging functionality
    // set to 1 for the first set of results
    // 11 for the second
    // ...
    if (videoresults)
        playListURL = feedURL + playlistID + '?v=2&max-results=' + videoresults + '&alt=json&callback=?';
    else
        playListURL = feedURL + playlistID + '?v=2&alt=json&callback=?';
    var videoURL = 'http://www.youtube.com/watch?v=';
    $.getJSON(playListURL, function (data) {
        var videos = "";
        $.each(data.feed.entry, function (i, item) {
            if (item != null) {
                var newVideo = new Video(item);
                videos += newVideo.videoBlock();
            }
        });
        $(videos).appendTo('#videos');
    });
}

function Video(video) {
    var watchURL = 'http://www.youtube.com/watch?v=';
    var embedURL = 'http://www.youtube.com/embed/';
    var thumb = 'http://img.youtube.com/vi/';

    if (video != null) {
        this.id = video.link[1].href.split('/')[6];
        this.image = thumb + this.id + '/hqdefault.jpg';
        this.videoURL = watchURL + this.id;
        this.embedURL = embedURL + this.id;
        this.author = video.author[0].name.$t;
        this.uploaded = video.published.$t;
        this.title = video.title.$t;
        this.description = video.media$group.media$description.$t;
        this.views = video.yt$statistics.viewCount;

        if (video.yt$rating != null) {
            this.likes = video.yt$rating.numLikes;
            this.dislikes = video.yt$rating.numDislikes;

            this.likeRatio = function () {
                if (this.likes + this.dislikes > 0)
                    return ((parseInt(this.likes) / (parseInt(this.likes) + parseInt(this.dislikes))).toFixed(2) * 100) - 1;
                else
                    return 0;
            }
            this.dislikeDisplay = this.dislikes == 1 ? this.dislikes + " dislike" : this.dislikes + " dislikes";
            this.likeDisplay = this.likes == 1 ? this.likes + " like" : this.likes + " likes";
        }

        this.length = ConvertTime(video.media$group.yt$duration.seconds);

        this.videoBlock = function () {
            var block = '';
            block += '<div class="video">';
            block += '<a href="' + this.embedURL + '?autoplay=1" class="fancy_video">';
            block += '<img width="170px" height="120px" src="' + this.image + '" alt="' + this.embedURL + '" title="' + this.title + '" />';
            block += '<span class="video_time">' + this.length + '</span>';
            block += '<h3 class="yt_title">' + this.title + '</h3>';
            block += '</a>';
            block += '<span class="yt_desc">' + this.description + '</span>';
            if (displayRatings && video.yt$rating != null && (this.likes > 0 || this.dislikes > 0)) {
                block += '<div class="rating">';
                block += '<span class="likes" style="width: ' + this.likeRatio() + '%"></span>';
                block += '<span class="dislikes" style="width: ' + (99 - this.likeRatio()) + '%"></span>';
                block += '<span style="width: 100%; height: 12px;">' + this.likeDisplay + ", " + this.dislikeDisplay + '</span>';
                block += '</div>';
            }
            block += '</div>';
            return block;
        }
    }
}

function Playlist(playlist) {
    if (playlist != null) {
        this.id = playlist.yt$playlistId.$t;
        this.title = playlist.title.$t;

        this.playlistBlock = function () {
            var block = '';
            block += '<li>';
            block += '<span id="' + this.id + '">';
            block += playlist.title.$t;
            block += '</span>';
            block += '</li>';

            return block;
        }
    }
}

function ConvertTime(sec) {
    var time = '';

    var hours = Math.floor(sec / 3600);
    var minutes = Math.floor(sec / 60);
    var seconds = sec % 60;

    if (hours > 0) {
        minutes %= 60;
        time += hours;
    }

    // Format With Leading Zeros
    if (minutes < 10 && hours > 0)
        minutes = '0' + minutes;
    if (seconds < 10)
        seconds = '0' + seconds;

    // Add Semicolons Where Needed
    if (minutes > 0) {
        if (hours > 0)
            time += ':' + minutes;
        else
            time += minutes;
    }

    if (seconds > 0) {
        if (minutes > 0)
            time += ':' + seconds;
        else
            time += '0:' + seconds;
    }
    else
        time += ':00';

    return time;
} 

(function ($) {
    $.fn.YouTube = function (options) {
        var defaults = {
            username: 'stihlusa',
            playlists: 10,
            videos: 10,
			ratings: true
        };
        var options = $.extend(defaults, options);

        return this.each(function () {
			displayRatings = options.ratings;
            GetPlaylists(options.username, options.playlists, options.videos);
        });
    };
})(jQuery);