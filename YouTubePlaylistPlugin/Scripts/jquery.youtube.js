﻿(function ($, window, document, undefined) {
    // Set any global settings here.
    $.youtube = $.extend({}, {
        version: "1.2.0",

        username: null,

        // Use themes a,b,c,d,e,f,etc.
        theme: null,

        // Allow search?
        search: false

    }, $.youtube);

    $.fn.playlists = function (options) {
        var defaults = {
            numberOfPlaylists: 10,
            thumbnail: {
                show: false
            }
        };
        var settings = $.extend(defaults, options);

        this.each(function () {
            // Set Global Variables
            numberOfPlaylists = settings.numberOfPlaylists;
            showPlaylistThumbnail = settings.thumbnail.show;
        });

        $playlistElement = this;
        $playlistElement.attr('data-theme', $.youtube.theme);

        youTube.getMostRecentVideos();
        youTube.getPlaylists();
    };

    $.fn.videos = function (options) {
        var defaults = {
            videosPerPage: 10,
            titleCharacters: 100,
            hdOnly: false,
            thumbnail: {
                show: false,
                ratings: true,
                description: true,
                descriptionCharacters: 200,
                views: true
            },
            fancybox: false
        };
        var settings = $.extend(defaults, options);

        this.each(function () {
            // Set Global Variables
            displayRatings = settings.thumbnail.ratings;
            videosPerPage = settings.videosPerPage;
            showDescription = settings.thumbnail.description;
            showViews = settings.thumbnail.views;

            if (settings.titleCharacters != '') {
                titleCharacters = settings.titleCharacters;
            }

            if (settings.descriptionCharacters != '') {
                descriptionCharacters = settings.descriptionCharacters;
            }

            hdOnly = settings.hdOnly;

            showVideoThumbnail = settings.thumbnail.show;
        });

        $videoElement = this;
        $videoElement.attr('data-theme', $.youtube.theme);
    };
})(jQuery);

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
var showVideoThumbnail;
var showPlaylistThumbnail;

var $playlistElement;
var $videoElement;

var youTube = function () {
    var feedURL = 'https://gdata.youtube.com/feeds/api/';
    var jsonUrl;

    function init() {
        // These events need to be 'on' because they are loaded after the DOM is ready
        $('body').on('click', '.fancy_video', function (ev) {
            // Call fancybox on the video
            $.fancybox({
                href: this.href,
                type: 'iframe'
            });
            ev.preventDefault();
        });

        $('#playlists').on('click', 'li', function () {
            // The user has clicked on a playlist, get the videos for that playlist
            currentPlaylistId = $(this).attr('id');
            videosInCurrentPlaylist = $(this).children('.video-count').html().split(' ')[0];
            getVideos(1, $videoElement);
        });

        $('#videos').on('click', 'span', function () {
            // This event is fired when the user interacts with the pager
            getVideos($(this).attr('start-index'), $videoElement);
        });

        $('#search-btn').click(function () {
            getSearchResults($('#search-txt').val(), $videoElement);
        });
    }

    function getMostRecentVideos() {
        var x = feedURL + 'videos?author=' + $.youtube.username + '&start-index=1&max-results=10&v=2&alt=json&format=5&orderby=published';

        // Clear the videos div
        $('#videos').html('');

        // https://developers.google.com/youtube/2.0/developers_guide_json
        $.getJSON(x, function (data) {
            var videos = "";
            var count = 0;

            if (!showVideoThumbnail)
                videos += '<ul>';

            // $.each(index, value)
            $.each(data.feed.entry, function (i, item) {
                if (item != null) {
                    count++;

                    var newVideo = new video(item);

                    if (!showVideoThumbnail)
                        videos += newVideo.listBlock();
                    else
                        videos += newVideo.thumbnail();
                }
            });

            if (!showVideoThumbnail)
                videos += '</ul>';

            $(videos).appendTo($('#videos'));
        });
    }

    function getPlaylists() {
        jsonURL = 'https://gdata.youtube.com/feeds/api/users/' + $.youtube.username + '/playlists?v=2&alt=json';
        
        if (numberOfPlaylists)
            jsonURL += '&max-results=' + numberOfPlaylists;
        
        var playlistIDs = '';
        var test;
        $.getJSON(jsonURL, function (data) {
            playlistIDs += '<h2>Playlists</h2>';
            playlistIDs += '<ul>';

            $.each(data.feed.entry, function (i, item) {
                var newPlaylist = new playlist(item);

                if (newPlaylist.numberOfVideos > 0) {
                    if (showPlaylistThumbnail) {
                        playlistIDs += newPlaylist.thumbnail();
                    }
                    else {
                        playlistIDs += newPlaylist.list();
                    }
                }
            });
            
            playlistIDs += '</ul>';
            
            // Return playlistIDs ?????????
            $(playlistIDs).appendTo($('#playlists'));
        });
    }

    function getVideos(startIndex, element) {
        jsonURL = feedURL + 'playlists/' + currentPlaylistId + '?v=2&alt=json&callback=?&format=5';

        // Clear the videos div
        $('#videos').html('');

        // Used for the paging functionality. Will get a set number of videos starting at the supplied index
        if (videosPerPage && startIndex)
            jsonURL += '&start-index=' + startIndex + '&max-results=' + videosPerPage;

        // Return only HD videos
        if (hdOnly) {
            jsonURL += '&hd';
        }

        // https://developers.google.com/youtube/2.0/developers_guide_json
        $.getJSON(jsonURL, function (data) {
            var videos = "";
            var count = 0;

            if (!showVideoThumbnail)
                videos += '<ul>';

            // $.each(index, value)
            $.each(data.feed.entry, function (i, item) {
                if (item != null) {
                    count++;

                    var newVideo = new video(item);

                    if (!showVideoThumbnail)
                        videos += newVideo.listBlock();
                    else
                        videos += newVideo.thumbnail();
                }
            });

            if (!showVideoThumbnail)
                videos += '</ul>';

            // Append next/prev buttons
            videos += '<div id="pager">';
            videos += buildPager(startIndex, count);
            videos += '</div>';

            $(videos).appendTo(element);
        });
    }

    function buildPager(startIndex, videosOnPage) {
        var builder = '';

        // Determine how many pages there should be
        var pages = Math.ceil(videosInCurrentPlaylist / videosPerPage);

        if (pages > 1) {
            if (startIndex != 1)
            // Build Prev button
                builder += '<span class="button" start-index="' + (startIndex - videosPerPage) + '">Previous</span>';

            var activePage = activePage(startIndex);

            // Build numbered list
            for (var i = 1; i <= pages; i++) {
                // Determines if the page should be marked as the 'active' page
                if (i == activePage)
                    builder += '<span class="active">';
                else
                    builder += '<span start-index="' + getStartIndex(i, startIndex) + '">';
                builder += i + '</span>';
            }

            // Build Next button
            // We are NOT on the first page
            if (videosInCurrentPlaylist > videosPerPage)
                if (videosOnPage == videosPerPage)
                    builder += '<span class="button" start-index="' + (parseInt(startIndex) + parseInt(videosPerPage)) + '">Next</span>';
        }

        return builder;

        function activePage(startIndex) {
            // ex (on first page, with 8 videos per page, num is 9)
            var num = parseInt(startIndex) + parseInt(videosPerPage);
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

        function getStartIndex(startIndex) {
            // Get the current page, subtract 1, and multiply times the number of videos per page
            // Add 1 to get the start index of the videos on that page
            return ((startIndex - 1) * videosPerPage) + 1;
        }
    }

    function video(video) {
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
                this.length = convertTime(video.media$group.yt$duration.seconds);
            }
            else {
                this.length = "0:00";
            }

            // Add necessary above information to the video block
            if (showVideoThumbnail) {
                this.thumbnail = function () {
                    var item = '';
                    //$block += $block('<div>');

                    item += '<div class="video" data-theme="' + $.youtube.theme + '">';
                    item += '<a href="' + this.embedURL + '?autoplay=1" class="fancy_video">';
                    item += '<div class="video-img">';
                    item += '<img width="288" src="' + this.image + '" alt="' + this.embedURL + '" title="' + this.title + '" />';
                    item += '<span class="video_time">' + this.length + '</span>';
                    item += '</div>';
                    item += '<div class="video-details">';
                    item += '<h2 class="yt_title">' + this.title + '</h2>';

                    if (showViews) {
                        item += '<span>' + formatViews(this.views) + '</span>';
                    }

                    item += '<span>' + $.youtube.username + ' | ' + formatDate(this.published) + '</span>';

                    if (showDescription) {
                        item += '<span class="yt_desc">' + this.description + '</span>';
                    }

                    if (displayRatings && video.yt$rating != null && (this.likes > 0 || this.dislikes > 0)) {
                        item += '<div class="rating">';
                        item += '<span class="likes" style="width: ' + (this.likeRatio() - 1) + '%"></span>';
                        item += '<span class="dislikes" style="width: ' + (99 - this.likeRatio()) + '%"></span>';
                        item += '<span style="width: 100%; height: 12px; clear: both;">' + this.likeDisplay + ", " + this.dislikeDisplay + '</span>';
                        item += '</div>';
                    }
                    item += '</div>';
                    item += '</a>';
                    item += '</div>';
                    return item;
                }
            }

            if (!showVideoThumbnail) {
                this.listBlock = function () {
                    var item = '';

                    item += '<li>';
                    item += '<a href="' + this.videoURL + '" target="_blank">';
                    item += '<h3 class="yt_title">' + this.title + '</h3>';
                    item += '</a>';
                    item += '</li>';

                    return item;
                }
            }
        }
    }

    function playlist(playlist) {
        if (playlist != null) {
            this.id = playlist.yt$playlistId.$t;
            this.title = playlist.title.$t;
            this.numberOfVideos = playlist.yt$countHint.$t;
            this.image = playlist.media$group.media$thumbnail[0].url;
            this.description = playlist.summary.$t;


            this.list = function () {
                var item = '';
                item += '<li>';
                item += '<span id="' + this.id + '" data-value="' + this.numberOfVideos + '">';
                item += this.title;
                item += '</span>';
                item += '</li>';

                return item;
            }

            this.thumbnail = function () {
                var item = '';
                item += '<li id="' + this.id + '">';
                item += '<h3>' + this.title + '</h3>';
                item += '<img src="' + this.image + '" title="' + this.title + '" />';
                item += '<span>' + $.youtube.username + '</span>'
                item += '<span class="video-count">' + this.numberOfVideos + ' videos</span>'
                item += '</li>';

                return item;


                item += '<span id="' + this.id + '" data-value="' + this.numberOfVideos + '">';
                item += '<img width="170px" height="120px" src="' + this.image + '" title="' + this.title + '" />';
                item += '<p>';
                item += this.description;
                item += '</p>';
            }
        }
    }

    function convertTime(sec) {
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

    function formatViews(number) {
        return addCommas(number) + ' views';
    }

    function addCommas(nStr) {
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
        else if (months > 0 && days > 30)
            retval = months + ' months';
        else if (days > 0)
            retval = days + ' days';

        return retval + ' ago';
    }

    function getSearchResults(terms, element) {
        jsonUrl += 'videos?q=' + escape(terms) + '&start-index=1&author=' + $.youtube.username;

        // Clear the videos div
        $('#videos').html('');

        // https://developers.google.com/youtube/2.0/developers_guide_json
        $.getJSON(jsonURL, function (data) {
            var videos = "";
            var count = 0;

            if (!showVideoThumbnail)
                videos += '<ul>';

            $.each(data.feed.entry, function (i, item) {
                if (item != null) {
                    count++;

                    var newVideo = new video(item);

                    if (!showVideoThumbnail)
                        videos += newVideo.listBlock();
                    else
                        videos += newVideo.thumbnail();
                }
            });

            if (!showVideoThumbnail)
                videos += '</ul>';

            $(videos).appendTo(element);
        });
    }

    return {
        init: init,
        getPlaylists: getPlaylists,
        getVideos: getVideos,
        getMostRecentVideos: getMostRecentVideos
    };
} ();


$(document).ready(function () {
    youTube.init();
});