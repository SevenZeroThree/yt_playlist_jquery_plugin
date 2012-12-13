# YouTube

Used to get the playlists for the supplied user, and the associated videos for those playlists.

<hr>
<h2>Global Parameters</h2>
	$.youtube.username: null 			(The username to get the playlists from)
	$.youtube.theme: null 				(The theme to use for the videos and playlists)
	$.youtube.search: false 			(Should a search function be present)

<h2>Playlist Parameters</h2>
<hr>
	numberOfPlaylists: 10,				(the number of playlists to get from the user above)
	playlistThumbnail: {
		show: false						(should there be a thumbnail for the playlists)
	}

<h2>Video Parameters</h2>
<hr>
	videosPerPage: 10,					(the number of videos per playlist to get from the user above)
	titleCharacters: 100,				(the number of characters to display for the title of the video)
	hdOnly: false,						(should only HD videos be returned by YouTube)
	videoThumbnail: {
		show: false,					(should there be a thumbnail for the videos)
		ratings: true,					(should the videos show the likes and dislikes)
		description: true,
		descriptionCharacters: 200,		(the number of characters to display in the description of the video)
		views: true						(should the number of views be displayed)
	},
	fancybox: false						(utilize the fancybox plugin to play the videos)