const Discord = require("discord.js");
var filedb = require("../filedb");

async function createState(params, dc) {
    var fd = new Date();
    fd.setMinutes(fd.getMinutes() + 30);

    var msg = await dc.channels.vnn.send(dc.mentions.lp + " What do you rate " + params.album + " out of 10? Voting ends in **30 minutes**!");
    [...dc.ratings].reverse().forEach(x => msg.react(x));

    return {
        state: "scoring",
        album: params.album,
        artist: params.artist,
        fd: fd.valueOf(),
        vMsg: msg.id,
        description: "",
        bestTracks: [],
        hottestBars: "",
        thumbnail: ""
    }
}

function run(state, dc) {
    filedb.set(state);
    dc.client.user.setPresence({
        activity: { name: "#voting-and-nominating", type: "COMPETING" },
        status: "online"
    });

    return {
        name: "scoring",
        isFinished: () => state.fd <= Date.now(),
        onFinish: async () => {
            var msg = await dc.channels.vnn.messages.fetch(state.vMsg);

            var scores = msg.reactions.cache.array().reduce((a,x) => {
                var i = dc.ratings.indexOf(x.emoji.toString());
                if (i == -1) return a;
                a[i] = x.count - 1;
                return a;
            }, []);

            console.log(scores);

            var avgScore = Math.round(scores.reduce((a,x,i) => a+(x*i), 0) / scores.reduce((a,x) => a + x, 0));

            var fields = [
                {name: "Collective Rating", value: avgScore + "/10"},
            ]

            if (state.bestTracks.length > 0) fields.push({ name: 'Best Tracks', value: state.bestTracks.map(x => " * " + x).join("\n")});
            if (state.hottestBars) fields.push({ name: 'Hottest Bars', value: state.hottestBars });

            var embed = new Discord.MessageEmbed()
                .setTitle(state.artist + " - " + state.album)
                .setDescription(state.description)
                .addFields(
                    ...fields
                )
                .setFooter(new Date().toLocaleDateString("en-GB", {year: "numeric", month: "long", day: "numeric"}));

            if (state.thumbnail) embed.setThumbnail(state.thumbnail);

            dc.channels.lp.send(embed);

            return {};
        },
        onMessage: (msg, member) => {
            if (!member.hasPermission("ADMINISTRATOR")) return;
            if (msg.content.startsWith("$desc ") || msg.content.startsWith("$description ")) {
                var tok = msg.content.split(" ");
                state.description = tok.slice(1).join(" ");
                msg.react("🙌");
                filedb.set(state);
            } else if (msg.content.startsWith("$bt ") || msg.content.startsWith("$best ") || msg.content.startsWith("$besttrack ")) {
                var tok = msg.content.split(" ");
                state.bestTracks.push(tok.slice(1).join(" "));
                msg.react("🙌");
                filedb.set(state);
            } else if (msg.content.startsWith("$hb ") || msg.content.startsWith("$hottest ") || msg.content.startsWith("$hottestbars ")) {
                var tok = msg.content.split(" ");
                state.hottestBars = tok.slice(1).join(" ");
                msg.react("🙌");
                filedb.set(state);
            } else if (msg.content.startsWith("$thumb") || msg.content.startsWith("$thumbnail")) {
                state.thumbnail = msg.attachments.array()[0].url;
                msg.react("🙌");
                filedb.set(state);
            } else if (msg.content == "$short") {
                state.fd = Date.now();
                filedb.set(state);
                msg.react("🙌");
            }
        }
    }
}

module.exports = { createState, run };