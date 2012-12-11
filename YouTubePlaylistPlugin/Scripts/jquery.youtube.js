(function (window, document, $, undefined) {
    // Set any global settings here.
    $.youtube = $.extend({}, {
        version: "1.2.0",

        username: null,

        // Use themes a,b,c,d,e,f,etc.
        theme: null,

        // Allow search?
        search: false

    }, $.youtube);

    var youTube = function () {
        // Register private variables
        var
            feedURL = 'https://gdata.youtube.com/feeds/api/',
            jsonUrl,
            rating;

        // Register global variables
        var $playlist, $video;

        function init() {
            $('#search-btn').click(function () {
                getSearchResults($('#search-txt').val(), youTube.videoElement());
            });
        }

        function getMostRecentVideos() {
            var x = feedURL + 'videos?author=' + $.youtube.username + '&start-index=1&max-results=10&v=2&alt=json&format=5&orderby=published';

            // Clear the videos div
            videoElement().html('');

            // https://developers.google.com/youtube/2.0/developers_guide_json
            $.getJSON(x, function (data) {
                var videos = "";
                var count = 0;

                if (!showVideoThumbnail)
                    videos += '<ul>';

                $.each(data.feed.entry, function (i, item) {
                    if (item != null) {
                        count++;

                        var newVideo = new video(item);

                        if (!showVideoThumbnail) {
                            videoElement().append(newVideo.list());
                        }
                        else
                            videoElement().append(newVideo.thumbnail());
                    }
                });

                if (!showVideoThumbnail)
                    videos += '</ul>';
            });
        }

        function getPlaylists() {
            jsonURL = 'https://gdata.youtube.com/feeds/api/users/' + $.youtube.username + '/playlists?v=2&alt=json';

            if (numberOfPlaylists)
                jsonURL += '&max-results=' + numberOfPlaylists;

            var playlistIDs = '';
            var test;
            $.getJSON(jsonURL, function (data) {
                playlistElement().append(
                    $('<h2/>',
                        {
                            text: 'Playlists'
                        }
                    )
                );

                $.each(data.feed.entry, function (i, item) {
                    var newPlaylist = new playlist(item);

                    if (newPlaylist.numberOfVideos > 0) {
                        if (showPlaylistThumbnail) {
                            playlistElement().append(newPlaylist.thumbnail());
                        }
                        else {
                            playlistElement().append(newPlaylist.list());
                        }
                    }
                });
            });
        }

        function getVideos(startIndex) {
            jsonURL = feedURL + 'playlists/' + currentPlaylistId + '?v=2&alt=json&callback=?&format=5';

            // Clear the videos div
            videoElement().html('');

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

                $.each(data.feed.entry, function (i, item) {
                    if (item != null) {
                        count++;

                        var newVideo = new video(item);

                        if (!showVideoThumbnail)
                            videoElement().append(newVideo.list());
                        else
                            videoElement().append(newVideo.thumbnail());
                    }
                });

                if (!showVideoThumbnail)
                    videos += '</ul>';

                // Append next/prev buttons
                videos += '<div id="pager">';
                videos += buildPager(startIndex, count);
                videos += '</div>';

                $(videos).appendTo(videoElement());
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
                        var $item =
                            $('<div/>',
                                {
                                    'class': 'video'
                                }
                            )
                            .append(
                                $('<a/>',
                                    {
                                        'href': this.embedURL + '?autoplay=1'
                                    }
                                )
                                .append(
                                    $('<div/>',
                                        {
                                            'class': 'video-img'
                                        }
                                    )
                                    .append(
                                        $('<img/>',
                                            {
                                                'src': this.image,
                                                'alt': this.embedURL,
                                                'title': this.title
                                            }
                                        )
                                    )
                                    .append(
                                        $('<span/>',
                                            {
                                                'class': 'video_time',
                                                text: this.length
                                            }
                                        )
                                    )
                                )
                                .append(
                                    $('<div/>',
                                        {
                                            'class': 'video-details'
                                        }
                                    )
                                    .append(
                                        $('<h2/>',
                                            {
                                                'class': 'yt_title',
                                                text: this.title
                                            }
                                        )
                                    )
                                    .append(
                                        $('<span/>',
                                            {
                                                text: formatViews(this.views)
                                            }
                                        )
                                    )
                                    .append(
                                        $('<span/>',
                                            {
                                                text: $.youtube.username + ' | ' + formatDate(this.published)
                                            }
                                        )
                                    )
                                    .append(
                                        $('<span/>',
                                            {
                                                'class': 'yt_desc',
                                                text: this.description
                                            }
                                        )
                                    )
                                    .append(
                                        $('<div/>',
                                            {
                                                'class': 'rating'
                                            }
                                        )
                                        .append(
                                            $('<span/>',
                                                {
                                                    'class': 'likes',
                                                    'style': 'width: ' + (this.likeRatio() - 1) + '%'
                                                }
                                            )
                                        )
                                        .append(
                                            $('<span/>',
                                                {
                                                    'class': 'dislikes',
                                                    'style': 'width: ' + (99 - this.likeRatio()) + '%'
                                                }
                                            )
                                        )
                                    )
                                )
                            );

                        return $item;
                    }
                }

                if (!showVideoThumbnail) {
                    this.list = function () {
                        var item = '';

                        var $item =
                            $('<li/>')
                            .append(
                                $('<a/>',
                                    {
                                        'href': this.videoURL,
                                        'target': '_blank'
                                    }
                                )
                                .append(
                                    $('<h3/>',
                                        {
                                            'class': 'yt_title',
                                            text: this.title
                                        }
                                    )
                                )
                            );

                        return $item;
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
                    var $item =
                        $('<li/>',
                            {
                                'id': this.id,
                                'data-value': this.numberOfVideos
                            }
                        )
                        .append(
                            $('<span/>',
                                {
                                    text: this.title
                                }
                            )
                        );

                    return $item;
                }

                this.thumbnail = function () {
                    var $item =
                        $('<li/>',
                            {
                                'id': this.id
                            }
                        )
                        .append(
                            $('<h3/>',
                                {
                                    text: this.title,
                                    'title': this.title
                                }
                            )
                        )
                        .append(
                            $('<img/>',
                                {
                                    'src': this.image,
                                    'title': this.title
                                }
                            )
                        )
                        .append(
                            $('<span/>',
                                {
                                    text: $.youtube.username
                                }
                            )
                        )
                        .append(
                            $('<span/>',
                                {
                                    'class': 'video-count',
                                    text: this.numberOfVideos + ' videos'
                                }
                            )
                        );

                    return $item;
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

        function getSearchResults(terms) {
            jsonUrl += 'videos?q=' + escape(terms) + '&start-index=1&author=' + $.youtube.username;

            // Clear the videos div
            youTube.videoElement().html('');

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

                $(videos).appendTo(youTube.videoElement());
            });
        }

        function setPlaylistElement(element) {
            $playlist = element;
        }

        function setVideoElement(element) {
            $video = element;
        }

        function setShowRating(value) {
            rating = value;
        }

        function playlistElement() {
            return $playlist;
        }

        function videoElement() {
            return $video;
        }

        function getShowRating() {
            return rating;
        }

        return {
            init: init,
            getPlaylists: getPlaylists,
            getVideos: getVideos,
            getMostRecentVideos: getMostRecentVideos,
            setVideoElement: setVideoElement,
            setPlaylistElement: setPlaylistElement,
            playlistElement: playlistElement,
            videoElement: videoElement,
            showRating: getShowRating
        };
    }();

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
            }
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
                descriptionCharacters = settings.thumbnail.descriptionCharacters;
            }

            hdOnly = settings.hdOnly;

            showVideoThumbnail = settings.thumbnail.show;
        });

        youTube.setVideoElement(this);

        youTube.videoElement().attr('data-theme', $.youtube.theme);
        youTube.videoElement().addClass('videos');

        // Register event handlers for clicking on the videos
        youTube.videoElement().on('click', 'span', function () {
            // This event is fired when the user interacts with the pager
            youTube.getVideos($(this).attr('start-index'));
        });

        youTube.getMostRecentVideos();
    };

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

        youTube.setPlaylistElement(this);
        
        youTube.playlistElement().attr('data-theme', $.youtube.theme);
        youTube.playlistElement().addClass('playlists');

        // Register event handlers for clicking on the playlists
        youTube.playlistElement().on('click', 'li', function () {
            // The user has clicked on a playlist, get the videos for that playlist
            currentPlaylistId = $(this).attr('id');
            videosInCurrentPlaylist = $(this).children('.video-count').html().split(' ')[0];
            youTube.getVideos(1);
        });

        youTube.getPlaylists();
    };

}(window, document, jQuery));

// Create global variables
var displayRatings;
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

