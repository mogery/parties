var filedb = require("../filedb");
var Discord = require("discord.js");
var playlist = require("../playlist");

async function createState(params, dc) {
    var fd = new Date();
    if (fd.getUTCHours() >= 18) fd.setUTCDate(fd.getUTCDate() + 1);
    fd.setUTCHours(18);
    fd.setUTCMinutes(0, 0, 0);

    dc.channels.vnn.send(dc.mentions.lp + " Nominate the next album for tomorrow's listening party at **3PM EST**. Use the commands explained in <#793270780002697216> to nominate. (Please use the commands in <#792994180313251850>.) Nomination ends at *1PM EST* tomorrow.");

    return {
        state: "nominating",
        fd: fd.valueOf(),
        noms: []
    };
}

function run(state, dc) {
    filedb.set(state);
    dc.client.user.setPresence({
        activity: { name: "#voting-and-nominating", type: "COMPETING" },
        status: "idle"
    });

    return {
        name: "nominating",
        isFinished: () => state.fd <= Date.now(),
        onFinish: async () => {
            var topNoms = [{score: Number.MIN_SAFE_INTEGER}]
            for (var x of state.noms) {
                var msg = await dc.channels.vnn.messages.fetch(x.msgId);
                x.score = msg.reactions.cache.array().reduce((a,x) => {
                    var e = x.emoji.toString();
                    if (e == "👍") return a += x.count - 1;
                    else if (e == "👎") return a -= x.count - 1;
                    else return a;
                }, 0);

                if (x.score > topNoms[0].score) topNoms = [x];
                else if (x.score == topNoms[0].score) topNoms.push(x);
            }

            console.log(topNoms);

            var chosenNom = topNoms[Math.floor(Math.random() * topNoms.length)];
            if (topNoms.length > 1) {
                dc.channels.vnn.send(dc.mentions.lp + " The people have chosen, and we have a tie! The winning album is chosen randomly, and it is... " + chosenNom.artist + " - " + chosenNom.album + "!");
            } else {
                dc.channels.vnn.send(dc.mentions.lp + " The people have chosen! We will be listening to " + chosenNom.artist + " - " + chosenNom.album + " at **3PM EST**.");
            }

            return {
                album: chosenNom.album,
                artist: chosenNom.artist,
                link: chosenNom.link,
                thumb: chosenNom.thumb
            };
        },
        onMessage: async (msg, member) => {
            var matches;
            if ((matches = msg.content.match(/^\$nom (.+?) - (.+?) (https?:\/\/(www\.)?youtube\.com\/.+?)( .+)?$/))) {
                var nom = {
                    artist: matches[1],
                    album: matches[2],
                    link: matches[3],
                    description: matches[5],
                    by: member.id
                }
                
                if (!(await playlist.validate(nom.link))) {
                    return msg.reply("This YouTube playlist is invalid.");
                }

                if (state.noms.find(x => x.artist.toLowerCase() == nom.artist.toLowerCase() && x.album.toLowerCase() == nom.album.toLowerCase())) {
                    return msg.reply("This album has already been nominated.");
                }

                nom.thumb = await playlist.image(nom.link);
                
                var embed = new Discord.MessageEmbed()
                    .setTitle(nom.artist + " - " + nom.album)
                    .setDescription(nom.description.trim())
                    .setURL(nom.link)
                    .setThumbnail(nom.thumb)
                    .setFooter("Nominated by " + msg.author.tag);
                var nMsg = await dc.channels.vnn.send(embed);
                await nMsg.react("👍");
                await nMsg.react("👎");
                nom.msgId = nMsg.id;

                state.noms.push(nom);
                filedb.set(state);
                msg.react("🙌");
            } else if (msg.content == "$short" && member.hasPermission("ADMINISTRATOR")) {
                state.fd = Date.now();
                filedb.set(state);
                msg.react("🙌");
            }
        }
    }
}

module.exports = { createState, run };
