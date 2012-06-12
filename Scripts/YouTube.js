var videoresults;
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
            playlistIDs += '<li><span id="' + item.link[1].href.split('/')[3].split('=')[1] + '">' + item.title.$t + '</span></li>';
        });
        playlistIDs += '</ul>';
        $(playlistIDs).appendTo('#playlist');
    });
}
function GetVideos(playlistID) {
    var feedURL = 'http://gdata.youtube.com/feeds/api/playlists/';
    //var playListURL = 'http://gdata.youtube.com/feeds/api/playlists/' + playlistID + '?v=2&alt=json&callback=?';
    var playListURL = '';
    if (videoresults)
        playListURL = feedURL + playlistID + '?v=2&max-results=' + videoresults + '&alt=json&callback=?';
    else
        playListURL = feedURL + playlistID + '?v=2&alt=json&callback=?';
    var videoURL = 'http://www.youtube.com/watch?v=';
    $.getJSON(playListURL, function (data) {
        var videos = "";
        $.each(data.feed.entry, function (i, item) {
            if (item != null) {
                var newVideo = new Video(item.link[1].href.split('/')[6],
                        item.title.$t,
                        item.yt$rating,
                        item.media$group,
                        item.yt$statistics);
                videos += newVideo.videoBlock();
            }
        });
        $(videos).appendTo('#videos');
    });
}

function Video(videoId, title, rating, mediaGroup, statistics) {
    var wtcURL = 'http://www.youtube.com/watch?v=';
    var embURL = 'http://www.youtube.com/embed/';
    var thumb = 'http://img.youtube.com/vi/';

    this.id = videoId;
    this.timeInSeconds = mediaGroup.yt$duration.seconds;
    this.videoURL = function () {
        return wtcURL + this.id;
    }
    this.embedURL = function () {
        return embURL + this.id;
    }
    this.image = function () {
        return thumb + this.id + '/hqdefault.jpg';
    }
    this.title = function () {
        if (title.indexOf('\"') != -1)
            title = title.replace('\"', '');
        return title;
    }
    this.description = function () {
        return mediaGroup.media$description.$t;
    }
    this.views = function () {
        statistics.viewCount;
    }
    this.likes = function () {
        if (rating != null)
            return parseInt(rating.numLikes);
        else
            return 0;
    }
    this.dislikes = function () {
        if (rating != null)
            return parseInt(rating.numDislikes);
        else
            return 0;
    }
    this.ratingRatio = function () {
        if (this.likes() + this.dislikes() > 0)
            return ((this.likes() / (this.likes() + this.dislikes())).toFixed(2) * 100) + '%';
        else
            return 0;
    }
    this.length = function () {
        var hours = Math.floor(this.timeInSeconds / 3600);
        var minutes = Math.floor(this.timeInSeconds / 60);
        var seconds = this.timeInSeconds % 60;
        var time = '';

        if (hours > 0) {
            minutes -= (hours * 60);
        }

        // Format With Leading Zeros
        if (minutes < 10 && hours > 0)
            minutes = '0' + minutes;
        if (seconds < 10)
            seconds = '0' + seconds;

        // Add Semicolons Where Needed
        if (hours > 0) {
            time += hours;
        }
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
    this.videoBlock = function () {
        var block = '';
        block += '<div>';
        block += '<a href="' + this.embedURL() + '?autoplay=1" class="fancy_video">';
        block += '<img width="170px" height="120px" src="' + this.image() + '" alt="' + this.embedURL() + '" title="' + this.title() + '" />';
        block += '<span class="video_time">' + this.length() + '</span>';
        block += '</a>';
        block += '<a href="' + this.embedURL() + '?autoplay=1" class="fancy_video">';
        block += '<h3 class="yt_title">' + this.title() + '</h3>';
        block += '</a>';
        block += '<span>' + this.description() + '</span>';
        block += '<span>' + this.ratingRatio() + '</span>';
        block += '</div>';
        return block;
    }
}

(function ($) {
    $.fn.YouTube = function (options) {
        var defaults = {
            username: 'stihlusa',
            playlists: 10,
            videos: 10
        };
        var options = $.extend(defaults, options);

        return this.each(function () {
            GetPlaylists(options.username, options.playlists, options.videos);
        });
    };
})(jQuery);