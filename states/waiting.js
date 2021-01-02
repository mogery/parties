var filedb = require("../filedb");

async function createState(params, dc) {
    var fd = new Date();
    fd.setHours(fd.getHours() + 2);

    return {
        state: "waiting",
        fd: fd.valueOf(),
        params
    };
}

function run(state, dc) {
    filedb.set(state);
    dc.client.user.setPresence({
        status: "idle"
    });

    return {
        name: "waiting",
        isFinished: () => state.fd <= Date.now(),
        onFinish: async () => {
            return state.params;
        },
        onMessage: async (msg, member) => {
            if (msg.content == "$short" && member.hasPermission("ADMINISTRATOR")) {
                state.fd = Date.now();
                filedb.set(state);
                msg.react("🙌");
            }
        }
    }
}

module.exports = { createState, run };