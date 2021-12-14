const NoteState = {
    LIVE:1, DEAD:0
};

class Note {
    constructor (atarget) {
        this.target = atarget
        this.scene = atarget.scene;
        this.state = NoteState.LIVE;
        this.ready = true;
        this.sprite = this.scene.add.sprite(atarget.sprite.x, 728, 'arrows', 3);
        this.sprite.angle = atarget.sprite.angle;
    }

    update(delta) {
        this.sprite.y -= this.scene.gamespeed * delta;

        if (this.sprite.y < -64) {
            this.state = NoteState.DEAD;
        }

        if (this.sprite.y < (this.target.sprite.y - 128)) {
            this.ready = false;
        }
    }

    destroy () {
        this.sprite.destroy();
        this.state = NoteState.DEAD;
    }
}

class Target {
    constructor (scene, x, y, d) {
        this.scene = scene;
        this.sprite = scene.add.sprite(x, y, 'arrows', 7);
        this.sprite.angle = d;
        this.notes = [];
    }

    createNote () {
        this.notes.push (new Note (this));
    }

    update(delta) {
        for (let i = 0; i < this.notes.length; i++) {
            this.notes[i] .update (delta);
        }
    }
};

class Conductor {
    constructor (ascene, list_of_cues) {
        this.scene = ascene;
        this.cues = list_of_cues;
        this.index = 0;
        this.total_time = 0;
    }

    update (delta) {
        this.total_time += delta;
        console.log(this.index.toString() + " vs " + this.cues.length.toString());
        if (this.index >= this.cues.length) { return; }


        if (this.cues[this.index].time >= this.total_time) {
            return;
        }

        while (this.cues[this.index].time <= this.total_time) {
            let slot = this.cues[this.index];
            if (slot.note == 0) {
                this.scene.leftArrow.createNote ();
            }
            else if (slot.note == 1) {
                this.scene.upArrow.createNote ();
            }
            else if (slot.note == 2) {
                this.scene.downArrow.createNote ();
            }
            else {
                this.scene.rightArrow.createNote ();
            }

            this.index++;
            if (this.index >= this.cues.length) { break; }
        }
    }
}

class Playfield extends Phaser.Scene {
    constructor() {
        super({key: "Level"});
        this.gamespeed = 300;
    }

    preload() {
        this.load.spritesheet('arrows', 'art/_arrow 1x8 (doubleres).png', {frameWidth: 128, frameHeight: 128});
    }

    create () {
        this.leftArrow = new Target(this, 240, 64, 90);
        this.upArrow = new Target(this, 370, 64, 180);
        this.downArrow = new Target(this, 500, 64, 0);
        this.rightArrow = new Target(this, 630, 64, 270);

        this.conductor = new Conductor (this, [
            {time: 1.0, note: 0},
            {time: 1.0, note: 3},
            {time: 1.5, note: 1},
            {time: 2.0, note: 2},
            {time: 2.5, note: 3}
        ]);
        this.start = Date.now();
    }

    update() {
        let now = Date.now();
        const delta = (now - this.start) / 1000;
        this.start = now;

        this.conductor.update(delta);
        this.leftArrow.update(delta);
        this.rightArrow.update(delta);
        this.upArrow.update(delta);
        this.downArrow.update(delta);
    }
};



/*************************************************************************** 
****************************************************************************/
var config = {
    type: Phaser.AUTO,
    // window size
    width: 800,
    height: 600,
    // set up physics process (if needed)
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scale: {
        // Fit to Window
        mode: Phaser.Scale.FIT,
        // Center vertically and horizontally
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    // specify the scenes that should start immediately
    scene: [Playfield]
};
new Phaser.Game (config);