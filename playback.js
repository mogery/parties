var ytdl = require("ytdl-core");

class Playback {
    constructor(list, connection, onFinished, index = 0, onIndexChange) {
        this.list = list;
        this.connection = connection;
        this.onFinished = onFinished;
        this.onIndexChange = onIndexChange;
        this.index = index;
    }

    abortPlayback() {
        if (this.dispatcher) this.dispatcher.destroy();
        if (this.stream) this.stream.destroy();
    }

    playCurrentTrack() {
        if (!this.list[this.index]) {
            if (this.onFinished) this.onFinished()
            return;
        }

        this.stream = ytdl(this.list[this.index].url, {
            quality: "highestaudio",
            filter: "audioonly"
        });

        this.dispatcher = this.connection.play(this.stream)
            .on("finish", () => {
                this.index++;
                if (this.onIndexChange) this.onIndexChange(this.index);
                this.playCurrentTrack();
            })
            .on("error", (err) => {
                console.error("An error occurred mid-playback:", err);
            })
    }

    skip() {
        this.abortPlayback();
        this.index++;
        if (this.onIndexChange) this.onIndexChange(this.index);
        this.playCurrentTrack();
    }

    back() {
        this.abortPlayback();
        this.index--;
        if (this.index < 0) this.index = 0;
        if (this.onIndexChange) this.onIndexChange(this.index);
        this.playCurrentTrack();
    }

    start(index = 0) {
        this.abortPlayback();
        this.index = index;
        if (this.onIndexChange) this.onIndexChange(this.index);
        this.playCurrentTrack();
    }

    end() {
        this.abortPlayback();
        if (this.onFinished) this.onFinished();
    }

    pause() {
        if (this.dispatcher) this.dispatcher.pause();
    }

    resume() {
        if (this.dispatcher) this.dispatcher.resume();
    }
}

module.exports = Playback;