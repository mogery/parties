var playlist = require("../playlist");
var Playback = require("../playback");
var filedb = require("../filedb");
var Discord = require("discord.js");

async function createState(params, dc) {
    return {
        state: "playback",
        album: params.album,
        artist: params.artist,
        thumb: params.thumb,
        list: await playlist.items(params.link),
        index: 0,
        finished: false
    };
}

function run(state, dc) {
    filedb.set(state);
    dc.client.user.setPresence({
        status: "online",
        activity: { name: state.album, type: "PLAYING" }
    });

    var playback;
    dc.channels.vc.join().then(conn => {
        playback = new Playback(state.list, conn, () => {
            dc.channels.vc.leave();
            state.finished = true;
            filedb.set(state);
        }, state.index, (ni) => {
            if (ni >= state.list.length) return;
            state.index = ni;
            filedb.set(state);

            var embed = new Discord.MessageEmbed()
                .setTitle("Now playing")
                .setDescription(state.list[state.index].snippet.title)
            
            if (state.list[state.index].snippet.thumbnails.maxres) embed.setThumbnail(state.list[state.index].snippet.thumbnails.maxres.url);
            dc.channels.d.send(embed);
        })
        playback.start(state.index);
    })

    return {
        name: "playback",
        isFinished: () => state.finished,
        onFinish: async () => {
            return {
                album: state.album,
                artist: state.artist
            };
        },
        onMessage: async (msg, member) => {
            if (!member.hasPermission("ADMINISTRATOR")) return;
            if (msg.content == "$short") {
                if (playback) {
                    playback.end();
                    msg.react("🙌");
                } else msg.react("💤");
            } else if (msg.content == "$pause") {
                if (playback) {
                    playback.pause();
                    msg.react("🙌");
                } else msg.react("💤");
            } else if (msg.content == "$resume") {
                if (playback) {
                    playback.resume();
                    msg.react("🙌");
                } else msg.react("💤");
            } else if (msg.content == "$skip") {
                if (playback) {
                    playback.skip();
                    msg.react("🙌");
                } else msg.react("💤");
            } else if (msg.content == "$back") {
                if (playback) {
                    playback.back();
                    msg.react("🙌");
                } else msg.react("💤");
            } else if (msg.content == "$start") {
                if (playback) {
                    playback.start();
                    msg.react("🙌");
                } else msg.react("💤");
            }
        }
    }
}
module.exports = { createState, run };
