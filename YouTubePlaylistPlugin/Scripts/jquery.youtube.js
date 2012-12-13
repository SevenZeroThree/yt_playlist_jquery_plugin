(function (window, document, $, undefined) {
    $.youtube = $.extend({}, {
        version: "1.2.0",
        username: null,
        theme: null,
        search: false
    }, $.youtube);

    var youTube = function () {
        var feedUrl = 'https://gdata.youtube.com/feeds/api/',
        video = function () {
            var element = null,
            numberOfVideos = null,
            currentPlaylistId = null,
            startIndex = null,
            defaults = {
                // video defaults
                videosPerPage: 10,
                titleCharacters: 100,
                hdOnly: false,
                videoThumbnail: {
                    show: true,
                    ratings: true,
                    description: true,
                    descriptionCharacters: 200,
                    views: true
                }
            },
            init = function (selector, options) {
                settings = $.extend(true, {}, defaults, options, settings);

                element = selector;
                element.attr('data-theme', $.youtube.theme);
                element.addClass('videos');

                // bind events
                events.bind();

                _mostRecent();
            },
            _video = function (video) {
                var watchURL = 'http://www.youtube.com/watch?v=';
                var embedURL = 'http://www.youtube.com/embed/';
                var thumb = 'http://img.youtube.com/vi/';

                if (video != null) {
                    this.id = video.link[1].href.split('/')[6];
                    this.image = thumb + this.id + '/hqdefault.jpg';
                    this.videoURL = watchURL + this.id;
                    this.embedURL = embedURL + this.id;
                    this.author = video.author[0].name.$t;
                    this.title = settings.titleCharacters == 0 ? video.title.$t : video.title.$t.substring(0, settings.titleCharacters);
                    this.published = video.published.$t.split('T')[0];

                    // Only care about the description if the user wants to show it
                    if (settings.videoThumbnail.description) {
                        // Ensure description is not null before assigning it
                        if (video.media$group.media$description != null) {
                            var desc = video.media$group.media$description.$t;
                            this.description = settings.videoThumbnail.descriptionCharacters == 0 ? desc : desc.substring(0, settings.videoThumbnail.descriptionCharacters);
                        }
                        else {
                            this.description = '';
                        }
                    }

                    // Only calculate views if the user wants views
                    if (settings.videoThumbnail.views) {
                        // Ensure we have views
                        if (video.yt$statistics != null) {
                            this.views = video.yt$statistics.viewCount;
                        }
                        else {
                            this.views = 0;
                        }
                    }

                    // Only calculate ratings info if the user wants to show ratings
                    if (settings.videoThumbnail.ratings) {
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
                        else {
                            this.likes = null;
                            this.dislikes = null;
                            this.likeRatio = function () {
                                return null;
                            };
                            this.dislikeDisplay = null;
                            this.likeDisplay = null;
                        }
                    }

                    // Null check for the duration
                    // This is null for private videos
                    if (video.media$group.yt$duration != null) {
                        this.length = _convertTime(video.media$group.yt$duration.seconds);
                    }
                    else {
                        this.length = "0:00";
                    }

                    // Add necessary above information to the video block
                    if (settings.videoThumbnail.show) {
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
                                                    text: _formatViews(this.views)
                                                }
                                            )
                                        )
                                        .append(
                                            $('<span/>',
                                                {
                                                    text: $.youtube.username + ' | ' + _formatDate(this.published)
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
                    else {
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
            },
            _mostRecent = function () {
                var url = feedUrl + 'videos?author=' + $.youtube.username + '&start-index=1&max-results=10&v=2&alt=json&format=5&orderby=published';

                _getVideos(url);
            },
            _getVideos = function (url) {
                element.html('');

                $.getJSON(url, function (data) {
                    var count = 0;
                    $.each(data.feed.entry, function (i, item) {
                        if (item != null) {
                            count++;

                            var newVid = new _video(item);

                            if (settings.videoThumbnail.show)
                                element.append(newVid.thumbnail());
                            else
                                element.append(newVid.list());
                        }
                    });

                    element.append(_buildPager(startIndex, count));
                });
            },
            _buildPager = function (currentPage, videosOnPage) {
                var builder = '<div id="pager" data-theme="' + $.youtube.theme + '">';

                // Determine how many pages there should be
                var pages = Math.ceil(numberOfVideos / settings.videosPerPage);

                if (pages > 1) {
                    if (currentPage != 1)
                        // Build Prev button
                        builder += '<span class="button" start-index="' + (currentPage - settings.videosPerPage) + '">Previous</span>';

                    var activePage = activePage(currentPage);

                    // Build numbered list
                    for (var i = 1; i <= pages; i++) {
                        // Determines if the page should be marked as the 'active' page
                        if (i == activePage)
                            builder += '<span class="active">';
                        else
                            builder += '<span start-index="' + getStartIndex(i, currentPage) + '">';
                        builder += i + '</span>';
                    }

                    // Build Next button
                    // We are NOT on the first page
                    if (numberOfVideos > settings.videosPerPage)
                        if (videosOnPage == settings.videosPerPage)
                            builder += '<span class="button" start-index="' + (parseInt(currentPage) + parseInt(settings.videosPerPage)) + '">Next</span>';
                }

                builder += '</div>';

                return builder;

                function activePage(currentPage) {
                    // ex (on first page, with 8 videos per page, num is 9)
                    var num = parseInt(currentPage) + parseInt(settings.videosPerPage);
                    var count = 0;

                    do {
                        // Subtract videosPerPage from num found earlier, and see if num is 1
                        // count keeps track of what page should be active
                        // When num is 1, count will be the number of the active page
                        num -= settings.videosPerPage;
                        count++;
                    } while (num != 1);

                    return count;
                }

                function getStartIndex(currentPage) {
                    // Get the current page, subtract 1, and multiply times the number of videos per page
                    // Add 1 to get the start index of the videos on that page
                    return ((currentPage - 1) * settings.videosPerPage) + 1;
                }
            },
            _convertTime = function (sec) {
                var time = '';

                var hours = Math.floor(sec / 3600);
                var minutes = Math.floor(sec / 60);
                var seconds = sec % 60;

                if (hours > 0) {
                    minutes %= 60;
                    time = hours;
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
            },
            _formatViews = function (number) {
                return _addCommas(number) + ' views';
            },
            _addCommas = function (nStr) {
                var rgx = /(\d+)(\d{3})/;

                while (rgx.test(nStr)) {
                    nStr = nStr.replace(rgx, '$1' + ',' + '$2');
                }

                return nStr;
            },
            _formatDate = function (time) {
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
            },
            setNumberOfVideos = function (value) {
                numberOfVideos = value;
            },
            setCurrentPlaylistId = function (value) {
                currentPlaylistId = value;
            },
            setStartIndex = function (value) {
                startIndex = value;
            },
            events = {
                bind: function() {
                    events.pagerClick();
                },
                pagerClick: function () {
                    element.on('click', 'span', function () {
                        // This event is fired when the user interacts with the pager
                        var self = $(this);
                        var start = $(this).attr('start-index');

                        var url = feedUrl + 'playlists/' + currentPlaylistId + '?v=2&alt=json&callback=?&format=5&start-index=' + start;

                        if (settings.videosPerPage)
                            url += '&max-results=' + settings.videosPerPage;

                        // Return only HD videos
                        if (settings.hdOnly) {
                            url += '&hd';
                        }

                        startIndex = start;

                        _getVideos(url);
                    });
                }
            };

            return {
                init: init,
                getVideos: _getVideos,
                setNumberOfVideos: setNumberOfVideos,
                setCurrentPlaylist: setCurrentPlaylistId,
                setStartIndex: setStartIndex,
                defaults: defaults
            }
        }(),
        playlist = function () {
            var element = null,
            current = null,
            numberOfVideos = null,
            defaults = {
                // playlist defaults
                numberOfPlaylists: 10,
                playlistThumbnail: {
                    show: false
                }
            },
            init = function (selector, options) {
                settings = $.extend(true, {}, defaults, options, settings);

                element = selector;
                element.attr('data-theme', $.youtube.theme);
                element.addClass('playlists');

                // bind events
                events.bind();

                _getPlaylists();
            },
            _getPlaylists = function () {
                var url = feedUrl + 'users/' + $.youtube.username + '/playlists?v=2&alt=json';

                if (settings.numberOfPlaylists != '' && settings.numberOfPlaylists > 0)
                    url += '&max-results=' + settings.numberOfPlaylists;

                $.getJSON(url, function (data) {
                    element.append(
                        $('<h2/>',
                            {
                                text: 'Featured Playlists'
                            }
                        )
                    );
                    
                    $.each(data.feed.entry, function (i, item) {
                        var newPlaylist = new _playlist(item);

                        if (newPlaylist.numberOfVideos > 0) {
                            var test = feedUrl + 'playlists/' + newPlaylist.id + '?v=2&alt=json&callback=?&format=5&max-results=4';

                            if (settings.playlistThumbnail.show) {
                                var img = 'http://img.youtube.com/vi/';
                                

                                $.getJSON(test, function (data) {
                                    var videos = '';
                                    videos += '<li>';
                                    videos += '<h4>' + newPlaylist.title + '</h4>';
                                    $.each(data.feed.entry, function (c, video) {
                                        //$asdf.append(
                                        //    $('<img/>',
                                        //        {
                                        //            'src': img + video.link[1].href.split('/')[6] + '/default.jpg'
                                        //        }
                                        //    )
                                        //);

                                        videos += '<img src="' + img + video.link[1].href.split('/')[6] + '/default.jpg" />';
                                        //videos += '<span>' + $.youtube.username + '</span>';
                                        videos += '<span class="video-count">' + newPlaylist.numberOfVideos + ' videos</span>';
                                    });
                                    videos += '</li>';
                                    //element
                                    //    .append(
                                    //        $('<div/>',
                                    //            {
                                    //                'class': 'playlist-thumb'
                                    //            }
                                    //        )
                                    //        .append(
                                    //            $('<h4/>',
                                    //                {
                                    //                    text: newPlaylist.title
                                    //                }
                                    //            )
                                    //        )
                                    //        .append(
                                    //            $asdf
                                    //        )
                                    //    );

                                    $(videos).appendTo(element);
                                });
                            }
                            else {
                                element.append(newPlaylist.list());
                            }
                        }
                    });
                });
            },
            _playlist = function (playlist) {
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
                                    'id': this.id,
                                    'data-value': this.numberOfVideos
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
            events = {
                bind: function () {
                    events.click();
                },
                click: function () {
                    element.on('click', 'li', function () {
                        // The user has clicked on a playlist, get the videos for that playlist
                        var self = $(this);
                        current = self.attr('id');

                        var url = feedUrl + 'playlists/' + current + '?v=2&alt=json&callback=?&format=5';

                        if (settings.videosPerPage)
                            url += '&max-results=' + settings.videosPerPage;

                        // Return only HD videos
                        if (settings.hdOnly) {
                            url += '&hd';
                        }

                        numberOfVideos = self.attr('data-value');
                        video.setNumberOfVideos(self.attr('data-value'));
                        video.setCurrentPlaylist(current);
                        video.setStartIndex(1);

                        video.getVideos(url);
                    });
                }
            };

            return {
                init: init,
                current: current,
                numberOfVideos: numberOfVideos,
                defaults: defaults
            }
        }(),
        settings = {};

        return {
            video: video,
            playlist: playlist
        }
    }();


    $.fn.videos = function (options) {
        youTube.video.init(this, options);
    };

    $.fn.playlists = function (options) {
        youTube.playlist.init(this, options);
    };

}(window, document, jQuery));