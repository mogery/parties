require("dotenv").config();
var Discord = require("discord.js");
var client = new Discord.Client();
var filedb = require("./filedb");

var dc = {
    client,
    guild: null,
    channels: {
        lp: null,
        vnn: null,
        vc: null,
        d: null,
    },
    mentions: {
        lp: "<@&" + process.env.DISCORD_LPROLE + ">"
    },
    playback: null,
    currentList: null,
    ratings: ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"]
};

var states = {
    nominating: require("./states/nominating"),
    waiting: require("./states/waiting"),
    playback: require("./states/playback"),
    scoring: require("./states/scoring"),
}
var stateOrder = ["nominating", "waiting", "playback", "scoring"];
var currentState;

client.on('ready', async () => {
    console.log("Logged in as", client.user.tag);

    dc.guild = await client.guilds.fetch(process.env.DISCORD_GUILD);
    dc.channels.lp = await dc.guild.channels.resolve(process.env.DISCORD_LP);
    dc.channels.vnn = await dc.guild.channels.resolve(process.env.DISCORD_VNN);
    dc.channels.vc = await dc.guild.channels.resolve(process.env.DISCORD_VC);
    dc.channels.d = await dc.guild.channels.resolve(process.env.DISCORD_D);

    var state = states[filedb.read().state];
    currentState = state.run(filedb.read(), dc);
    var finishing = false;

    setInterval(async function stateCheck() {
        if (finishing) return;
        if (currentState.isFinished()) {
            finishing = true;
            console.log("State", currentState.name, "finished.");
            var params = await currentState.onFinish();

            var nextStateI = (stateOrder.indexOf(currentState.name) + 1) % stateOrder.length;
            var nextState = states[stateOrder[nextStateI]];
            console.log("Switching to state", stateOrder[nextStateI]);
            finishing = false;
            currentState = nextState.run(await nextState.createState(params, dc), dc);
        }
    }, 1000);
});

client.on('message', async (msg) => {
    if (msg.author && msg.author.bot) return;
    if (!msg.guild || msg.guild.id != dc.guild.id) return;
    if (!msg.member) {
        console.log("Member-less message thrown away." + (msg.author ? "Author:" + msg.author.tag : ""));
    } else {
        if (currentState) currentState.onMessage(msg, msg.member);
    }
    // if (!msg.content.startsWith("$")) return;
    // if (!msg.member.hasPermission("ADMINISTRATOR")) return msg.react("⁉️");
    // if (msg.content == "$join") {
    //     var conn = await channels.vc.join();
    //     playback = new Playback(currentList, conn, () => {
    //         channels.vc.leave();
    //         msg.reply("Playback finished.");
    //     })
    //     playback.start();
    // } else if (msg.content == "$leave") {
    //     if (playback) playback.abortPlayback();
    //     channels.vc.leave();
    // } else if (msg.content == "$pause") {
    //     if (playback) playback.pause();
    // } else if (msg.content == "$resume") {
    //     if (playback) playback.resume();
    // } else if (msg.content == "$skip") {
    //     if (playback) playback.skip();
    // } else if (msg.content == "$end") {
    //     if (playback) playback.end();
    // } else if (msg.content == "$back") {
    //     if (playback) playback.back();
    // } else if (msg.content.startsWith("$list ")) {
    //     var tok = msg.content.split(" ");
    //     var url = tok[1];
    //     currentList = await playlist(url);
    //     msg.reply("got " + currentList.length + " tracks");
    // } else if (msg.content.startsWith("$vote ")) {
    //     var tok = msg.content.split(" ");
    //     var name = tok.slice(1).join(" ");
    //     var message = "<@&793161606855000085> What do you rate " + name + "? Voting ends in 30 minutes!";
    //     var msgO = await channels.vnn.send(message);
    //     ratings.reverse().forEach(x => msgO.react(x));
    // } else if (msg.content.startsWith("$tally ")) {
    //     var tok = msg.content.split(" ");
    //     var id = tok[1];
    //     var rmsg = await channels.vnn.messages.fetch(id);

    //     var scores = rmsg.reactions.cache.array().reduce((a,x) => {
    //         var i = ratings.indexOf(x.emoji.toString());
    //         if (i == -1) return a;
    //         a[i] = x.count - 1;
    //         return a;
    //     }, []);

    //     var avgScore = Math.round(scores.reduce((a,x,i) => a+(x*i), 0) / scores.reduce((a,x) => a + x, 0));

    //     msg.channel.send({
    //         embed: {
                
    //         }
    //     })
    //     msg.reply(avgScore + "/10");
    // }
});

client.login(process.env.DISCORD_TOKEN);
