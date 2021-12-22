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
    // Note.update()
    update(delta) {
        this.sprite.y -= this.scene.gamespeed * delta;

        if (this.sprite.y < -64) {
            this.state = NoteState.DEAD;
        }

        if (this.sprite.y < (this.target.sprite.y - 128)) {
            this.ready = false;
        }
    }

    flash () {
        this.sprite.play ('flash', true);
    }

    destroy () {
        this.sprite.destroy();
        this.state = NoteState.DEAD;
    }
}

class Lane {
    constructor (scene, x, y, d) {
        this.scene = scene;
        this.sprite = scene.add.sprite(x, y, 'arrows', 7);
        this.sprite.angle = d;
        this.notes = [];
        this.sprite.on(Phaser.Animations.Events.ANIMATION_COMPLETE, function () {
            this.sprite.setFrame (7);
        }, this);
    }

    createNote () {
        this.notes.push (new Note (this));
    }
    // Lane.update()
    update(delta) {
        // create a new list that will hold notes that are still alive
        let newlist = [];

        // go through our existing list and ask each note to update
        for (let i = 0; i < this.notes.length; i++) {
            // update a note
            this.notes[i] .update (delta);

            // if the note is dead, reclaim its memory
            if (this.notes[i].state == NoteState.DEAD) {
                this.notes[i].destroy ();
            }
            // else add to new list
            else {
                newlist .push (this.notes[i]);
            }
        }

        // switch old list and new list
        this.notes = newlist;
    }

    getFirstReadyIndex () {
        // go through list of notes and find the first one that is ready
        for (let i = 0; i < this.notes.length; i++) {
            if (this.notes[i].ready == true) { return i; }
        }
        return -1;
    }

    flash () {
        this.sprite.play ('flash', true);
    }

    trigger () {
        let rindex = this.getFirstReadyIndex ();
        let scored = 0;
        console.log (`Ready is ${rindex}`)

        if (rindex < 0) { return }
        this.notes[rindex].ready = false;

        let distance = Math.abs(this.notes[rindex].sprite.y - this.sprite.y);

        if (distance > 128) {
            this.notes[rindex].sprite.setFrame (0);
        }
        else if (distance < 8) {
            this.flash();
            scored = 100;
        }
        else if (distance < 16) {
            this.flash();
            scored = 50;
        }
        else if (distance < 64) {
            this.flash();
            scored = 25;
        }
        return scored;
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
        this.load.image('good', 'art/good.png');
        this.load.image('bad', 'art/bad.png');
        this.load.image('sick', 'art/sick.png');
        this.load.image('sht', 'art/sh-t.png');
    }

    create () {
        // set up the keys that will trigger our arrow clicks
        this.downKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
        this.upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
        this.leftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        this.rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);

        // create our lanes
        this.leftArrow = new Lane(this, 240, 64, 90);
        this.upArrow = new Lane(this, 370, 64, 180);
        this.downArrow = new Lane(this, 500, 64, 0);
        this.rightArrow = new Lane(this, 630, 64, 270);

        // create a conductor and give it some demo notes to produce
        this.conductor = new Conductor (this, [
            {time: 1.0, note: 0},
            {time: 1.0, note: 3},
            {time: 1.5, note: 1},
            {time: 2.0, note: 2},
            {time: 2.5, note: 3}
        ]);

        // create an animation called flash. this animation causes sprites to flash
        this.anims.create({
            key: 'flash',
            frames: this.anims.generateFrameNumbers('arrows', { 
                frames: [ 0, 1, 2, 3, 4, 5, 6, 7 ] 
            }),
            frameRate: 20,
            repeat: 0
        });
        
        // Set our global timer
        this.start = Date.now();
    }

    update() {
        // calculate delta time (the difference in time between last update and this update)
        let now = Date.now();
        const delta = (now - this.start) / 1000;
        this.start = now;

        // check to see if a key was pressed. the player must release the key and then press
        // again for this to be true in later frames

        if (Phaser.Input.Keyboard.JustDown (this.upKey)) {
            this.upArrow.trigger();
        }
        if (Phaser.Input.Keyboard.JustDown (this.downKey)) {
            this.downArrow.trigger();
        }
        if (Phaser.Input.Keyboard.JustDown (this.leftKey)) {
            this.leftArrow.trigger();
        }
        if (Phaser.Input.Keyboard.JustDown (this.rightKey)) {
            this.rightArrow.trigger();
        }

        // tell our game objects to update themselves according to delta time
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