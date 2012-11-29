// Create global variables
var displayRatings;
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
var showList;

$(document).ready(function () {

    // These events need to be 'on' because they are loaded after the DOM is ready
    $('body').on('click', '.fancy_video', function (ev) {
        // Call fancybox on the video
        $.fancybox({
            href: this.href,
            type: 'iframe'
        });
        ev.preventDefault();
    });

    $('#playlists').on('click', 'span', function () {
        // The user has clicked on a playlist, get the videos for that playlist
        currentPlaylistId = $(this).attr('id');
        videosInCurrentPlaylist = $(this).attr('data-value');
        GetVideos(1);
    });

    $('#videos').on('click', 'span', function () {
        // This event is fired when the user interacts with the pager
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
    var feedURL = 'http://gdata.youtube.com/feeds/api/playlists/';
    var playListURL = feedURL + currentPlaylistId + '?v=2&alt=json&callback=?';

    // Clear the videos div
    $('#videos').html('');

    // Used for the paging functionality. Will get a set number of videos starting at the supplied index
    if (videosPerPage && p_startIndex)
        playListURL += '&start-index=' + p_startIndex + '&max-results=' + videosPerPage;

    // Return only HD videos
    if (hdOnly) {
        playListURL += '&hd';
    }

    // https://developers.google.com/youtube/2.0/developers_guide_json
    $.getJSON(playListURL, function (data) {
        var videos = "";
        var count = 0;

        if (showList)
            videos += '<ul>';
            
        // $.each(index, value)
        $.each(data.feed.entry, function (i, item) {
            if (item != null) {
                count++;

                var newVideo = new Video(item);

                if (showList)
                    videos += newVideo.listBlock();
                else
                    videos += newVideo.videoBlock();
            }
        });

        if (showList)
            videos += '</ul>';

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
        if (p_startIndex != 1)
            // Build Prev button
            builder += '<span class="button" start-index="' + (p_startIndex - videosPerPage) + '">Previous</span>';

        var activePage = ActivePage(p_startIndex);
        
        // Build numbered list
        for (var i = 1; i <= pages; i++) {
            // Determines if the page should be marked as the 'active' page
            if (i == activePage)
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
    // ex (on first page, with 8 videos per page, num is 9)
    var num = parseInt(p_startIndex) + parseInt(videosPerPage);
    var count = 0;

    do {
        // Subtract videosPerPage from num found earlier, and see if num is 1
        // count keeps track of what page should be active
        // When num is 1, count will be the number of the active page
        num -= videosPerPage;
        count++;
    } while (num != 1);

    return count;
}

function GetStartIndex(p_page, p_startIndex) {
    // Get the current page, subtract 1, and multiply times the number of videos per page
    // Add 1 to get the start index of the videos on that page
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
        this.published = video.published.$t.split('T')[0];

        // Only care about the description if the user wants to show it
        if (showDescription) {
            // Ensure description is not null before assigning it
            if (video.media$group.media$description != null) {
                var desc = video.media$group.media$description.$t;
                this.description = descriptionCharacters == 0 ? desc : desc.substring(0, descriptionCharacters);
            }
            else {
                this.description = '';
            }
        }

        // Only calculate views if the user wants views
        if (showViews) {
            // Ensure we have views
            if (video.yt$statistics != null) {
                this.views = video.yt$statistics.viewCount;
            }
            else {
                this.views = 0;
            }
        }

        // Only calculate ratings info if the user wants to show ratings
        if (displayRatings) {
            // Ensure we have ratings
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
        }

        // Null check for the duration
        // This is null for private videos
        if (video.media$group.yt$duration != null) {
            this.length = ConvertTime(video.media$group.yt$duration.seconds);
        }
        else {
            this.length = "0:00";
        }

        // Add necessary above information to the video block
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
                block += '<span>' + FormatViews(this.views) + '</span>';
            }

            block += '<span>' + user + ' | ' + formatDate(this.published) + '</span>';
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

        this.listBlock = function () {
            var item = '';

            item += '<li>';
            item += '<a href="' + this.embedURL + '?autoplay=1" class="fancy_video">';
            item += '<h3 class="yt_title">' + this.title + '</h3>';
            item += '</a>';
            item += '</li>';

            return item;
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

function formatDate(time) {
    var today = new Date();
    var videoDate = new Date(time);
    var years;
    var months;
    var days;
    var retval;

    years = today.getYear() - videoDate.getYear();
    months = today.getMonth() - videoDate.getMonth();
    days = today.getDay() - videoDate.getDay();

    if (years > 0)
        retval = years + ' years';
    else if (months > 0)
        retval = months + ' months';
    else if (days > 0)
        retval = days + ' days';

    return retval + ' ago';
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
            list: false
        };
        var settings = $.extend(defaults, options);

        return this.each(function () {
            // Set Global Variables
			displayRatings = settings.ratings;
            numberOfPlaylists = settings.numberOfPlaylists;
            videosPerPage = settings.videosPerPage;
            showDescription = settings.description;
            showViews = settings.views;
            user = settings.username;

            if (settings.titleCharacters != '') {
                titleCharacters = settings.titleCharacters;
            }

            if (settings.descriptionCharacters != '') {
                descriptionCharacters = settings.descriptionCharacters;
            }

            hdOnly = settings.hdOnly;

            showList = settings.list;

            // Get the playlists
            GetPlaylists(user);
        });
    };
})(jQuery);