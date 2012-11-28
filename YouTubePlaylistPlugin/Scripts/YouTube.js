/*
TODO:   Add BuildPager function to introduce true paging (eg list of pages (1, 2, 3, etc))
*/

var displayRatings;

// Create global variables so we aren't passing these values over and over???
var user;
var numberOfPlaylists;
var videosPerPage;
var currentPlaylistId;
var videosInCurrentPlaylist;
var descriptionCharacters = 0;
var showDescription;
var titleCharacters = 0;
var showViews;
var hdOnly;

$(document).ready(function () {

    $('body').on('click', '.fancy_video', function (ev) {
        $.fancybox({
            href: this.href,
            type: 'iframe'
        });
        ev.preventDefault();
    });

    $('#playlists').on('click', 'span', function () {
        currentPlaylistId = $(this).attr('id');
        videosInCurrentPlaylist = $(this).attr('data-value');
        GetVideos(1);
    });

    $('#videos').on('click', 'span', function () {
        GetVideos($(this).attr('start-index'));
    });
});

function GetPlaylists(username) {
    var feedURL = 'https://gdata.youtube.com/feeds/api/users/';
    var jsonURL = '';

    jsonURL = feedURL + username + '/playlists?v=2&alt=json';

    if (numberOfPlaylists)
        jsonURL += '&max-results=' + numberOfPlaylists;

    $.getJSON(jsonURL, function (data) {
        var playlistIDs = '';
        playlistIDs += '<ul>';
        $.each(data.feed.entry, function (i, item) {
            var newPlaylist = new Playlist(item);
            if (newPlaylist.numberOfVideos > 0)
                playlistIDs += newPlaylist.playlistBlock();
        });
        playlistIDs += '</ul>';
        $(playlistIDs).appendTo('#playlists');
    });
}

function GetVideos(p_startIndex) {
    $('#videos').html('');
    var feedURL = 'http://gdata.youtube.com/feeds/api/playlists/';
    var playListURL = feedURL + currentPlaylistId + '?v=2&alt=json&callback=?';

    if (videosPerPage && p_startIndex)
        playListURL += '&start-index=' + p_startIndex + '&max-results=' + videosPerPage;

    if (hdOnly) {
        playListURL += '&hd';
    }

    $.getJSON(playListURL, function (data) {
        var videos = "";
        var count = 0;
        $.each(data.feed.entry, function (i, item) {
            if (item != null) {
                count++;
                var newVideo = new Video(item);
                videos += newVideo.videoBlock();
            }
        });

        // Append next/prev buttons
        videos += '<div id="pager">';
        videos += BuildPager(p_startIndex, count);
        videos += '</div>';
        $(videos).appendTo('#videos');
    });
}

function BuildPager(p_startIndex, p_videosOnPage) {
    var builder = '';

    // Determine how many pages there should be
    var pages = Math.ceil(videosInCurrentPlaylist / videosPerPage);

    if (pages > 1) {
        // Build Prev button
        if (p_startIndex != 1)
            builder += '<span class="button" start-index="' + (p_startIndex - videosPerPage) + '">Previous</span>';

        var newActivePage = ActivePage(p_startIndex);
        
        // Build numbered list
        for (var i = 1; i <= pages; i++) {
            // Determine current page here?
            if (i == newActivePage)
                builder += '<span class="active">';
            else
                builder += '<span start-index="' + GetStartIndex(i, p_startIndex) + '">';
            builder += i + '</span>';
        }
        
        // Build Next button
        // We are NOT on the first page
        if (videosInCurrentPlaylist > videosPerPage)
            if (p_videosOnPage == videosPerPage)
                builder += '<span class="button" start-index="' + (parseInt(p_startIndex) + parseInt(videosPerPage)) + '">Next</span>';
    }

    return builder;
}

function ActivePage(p_startIndex) {
    var num = parseInt(p_startIndex) + parseInt(videosPerPage);
    var count = 0;
    do {
        num -= videosPerPage;
        count++;
    } while (num != 1);

    return count;
}

function GetStartIndex(p_page, p_startIndex) {
    return ((p_page - 1) * videosPerPage) + 1;
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
        this.title = titleCharacters == 0 ? video.title.$t : video.title.$t.substring(0, titleCharacters);

        if (video.media$group.media$description != null) {
            var desc = video.media$group.media$description.$t;
            this.description = descriptionCharacters == 0 ? desc : desc.substring(0, descriptionCharacters);
        }
        else {
            this.description = '';
        }

        if (video.yt$statistics != null) {
            this.views = video.yt$statistics.viewCount;
        }

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

        if (video.media$group.yt$duration != null) {
            this.length = ConvertTime(video.media$group.yt$duration.seconds);
        }
        else {
            this.length = "0:00";
        }

        this.videoBlock = function () {
            var block = '';
            block += '<div class="video">';
            block += '<a href="' + this.embedURL + '?autoplay=1" class="fancy_video">';
            block += '<div class="video-img">';
            block += '<img width="170px" height="120px" src="' + this.image + '" alt="' + this.embedURL + '" title="' + this.title + '" />';
            block += '<span class="video_time">' + this.length + '</span>';
            block += '</div>';
            block += '<h3 class="yt_title">' + this.title + '</h3>';
            if (showViews) {
                block += '<span>' + FormatViews(this.views) + ' | days ago</span>';
            }
            block += '<span>' + user + '</span>';
            block += '</a>';
            if (showDescription) {
                block += '<span class="yt_desc">' + this.description + '</span>';
            }
            if (displayRatings && video.yt$rating != null && (this.likes > 0 || this.dislikes > 0)) {
                block += '<div class="rating">';
                block += '<span class="likes" style="width: ' + (this.likeRatio() - 1) + '%"></span>';
                block += '<span class="dislikes" style="width: ' + (99 - this.likeRatio()) + '%"></span>';
                block += '<span style="width: 100%; height: 12px; clear: both;">' + this.likeDisplay + ", " + this.dislikeDisplay + '</span>';
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
        this.numberOfVideos = playlist.yt$countHint.$t;

        this.playlistBlock = function () {
            var block = '';
            block += '<li>';
            block += '<span id="' + this.id + '" data-value="' + this.numberOfVideos + '">';
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

function FormatViews(number) {
    return addCommas(number) + ' views';
}

function addCommas(nStr)
{
    var rgx = /(\d+)(\d{3})/;

    while (rgx.test(nStr)) {
        nStr = nStr.replace(rgx, '$1' + ',' + '$2');
    }

    return nStr;
}


(function ($) {
    $.fn.YouTube = function (options) {
        var defaults = {
            username: 'stihlusa',
            numberOfPlaylists: 10,
            videosPerPage: 10,
			ratings: false,
            titleCharacters: 100,
            description: true,
            descriptionCharacters: 200,
            views: true,
            hdOnly: false,
            orderBy: 'viewCount' // Add orderBy for videos and playlists https://developers.google.com/youtube/2.0/reference#orderbysp ??
        };
        var options = $.extend(defaults, options);

        return this.each(function () {
            // Set Global Variables
			displayRatings = options.ratings;
            numberOfPlaylists = options.numberOfPlaylists;
            videosPerPage = options.videosPerPage;
            showDescription = options.description;
            showViews = options.views;
            user = options.username;
            if (options.titleCharacters != '') {
                titleCharacters = options.titleCharacters;
            }
            if (options.descriptionCharacters != '') {
                descriptionCharacters = options.descriptionCharacters;
            }
            hdOnly = options.hdOnly;

            // Get the playlists
            GetPlaylists(user);
        });
    };
})(jQuery);