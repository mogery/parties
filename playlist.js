var {google} = require("googleapis");

var service = google.youtube("v3");

module.exports = {
    validate: async function playlistValidate(link) {
        var listid = new URL(link).searchParams.get("list");
        if (!listid) return false;

        var res = await service.playlists.list({
            auth: process.env.YOUTUBE_API_KEY,
            part: "snippet",
            id: listid
        });

        if (res.data.items.length == 0) return false;
        return true;
    },
    items: async function playlistItems(link) {
        var listid = new URL(link).searchParams.get("list");
        var res = await service.playlistItems.list({
            auth: process.env.YOUTUBE_API_KEY,
            maxResults: 50,
            part: "snippet,contentDetails",
            playlistId: listid
        })

        return res.data.items.map(x => {
            x.url = "https://www.youtube.com/watch?v=" + x.contentDetails.videoId;
            return x;
        });
    },
    info: async function playlistInfo(link) {
        var listid = new URL(link).searchParams.get("list");
        var res = await service.playlists.list({
            auth: process.env.YOUTUBE_API_KEY,
            part: "snippet",
            id: listid
        });

        return {...res.data.items[0], plId: listid};
    },
    image: async function playlistImage(link) {
        var listid = new URL(link).searchParams.get("list");
        var res = await service.playlists.list({
            auth: process.env.YOUTUBE_API_KEY,
            part: "snippet",
            id: listid
        });

        return Object.values(res.data.items[0].snippet.thumbnails).reduce((a,x) => x.width >= a.width ? x : a, {width: 0, height: 0}).url;
    }
}