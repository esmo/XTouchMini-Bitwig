/** 
 * Bitwig Controller Script for Behringer X-Touch Mini
 * (c) 2025 Edouard J. Simon  
 * 
 * Version 0.1
 */

function XtmHardware(app) {

    /** Note controls */
    const XTM_BUTTON_TRACK_PREV = 0x08;
    const XTM_BUTTON_TRACK_NEXT = 0x09;

    const XTM_BUTTON_CLICK = 0x11;
    const XTM_BUTTON_BACK = 0x12;
    const XTM_BUTTON_FWD = 0x13;
    const XTM_BUTTON_LOOP = 0x14;
    const XTM_BUTTON_STOP = 0x15;
    const XTM_BUTTON_PLAY = 0x16;
    const XTM_BUTTON_REC = 0x17;
    const XTM_BUTTON_TRACK_SOLO = 0x0a;
    const XTM_BUTTON_TRACK_MUTE = 0x0b;
    const XTM_BUTTON_TRACK_ARM = 0x0f;

    const XTM_ENC_BUTTON_TRACK_VOLUME = 0x00;
    const XTM_ENC_BUTTON_TRACK_PAN = 0x01;

    /** CC controls */
    const XTM_FADER = 0x09;
    const XTM_ENC_TRACK_VOLUME = 0x01;
    const XTM_ENC_TRACK_PAN = 0x02;

    this.app = app;


    this.noteControls = {};
    this.ccControls = {};

    for (const element of [1, 2, 3, 4, 5, 6, 7, 8]) {
        this.app.sendCC(element + 8, 28)
    }
    this.app.host.scheduleTask(function () {
        // reset encoders
        for (const element of [1, 2, 3, 4, 5, 6, 7, 8]) {
            this.app.sendCC(element + 8, 0)
        }
    }, 2000);


    /** flush */
    this.updateControls = () => {


        for (const key in this.noteControls) {
            this.noteControls[key].update();
        }
        for (const key in this.ccControls) {
            this.ccControls[key].update();
        }
    }

    /** master fader */
    this.ccControls[XTM_FADER] = new MasterFader(app);

    /** encoder track volume */
    this.ccControls[XTM_ENC_TRACK_VOLUME] = new Encoder(XTM_ENC_TRACK_VOLUME, app);
    this.ccControls[XTM_ENC_TRACK_VOLUME].call = function (value) {
        this.app.cursorTrackController.cursorTrack.volume().value().set(value, 128);
    }
    this.ccControls[XTM_ENC_TRACK_VOLUME].update = function () {
        var currentTrack = this.app.cursorTrackController.getCurrentTrack();
        var volume = currentTrack.getVolume();
        if (volume) {
            this.setValue(Math.floor(volume / 127 * 13));
        }
    };

    /** encoder track pan */
    this.ccControls[XTM_ENC_TRACK_PAN] = new Encoder(XTM_ENC_TRACK_PAN, app);
    this.ccControls[XTM_ENC_TRACK_PAN].call = function (value) {
        this.app.cursorTrackController.cursorTrack.pan().value().set(value, 128);
    }
    this.ccControls[XTM_ENC_TRACK_PAN].update = function () {
        var currentTrack = this.app.cursorTrackController.getCurrentTrack();
        var pan = currentTrack.getPan();
        if (pan) {
            this.setValue(parseFloat(pan) * 12 + 1);
        }
    };

    let buttons = [
        XTM_ENC_BUTTON_TRACK_VOLUME,
        XTM_ENC_BUTTON_TRACK_PAN,
        XTM_BUTTON_TRACK_PREV,
        XTM_BUTTON_TRACK_NEXT,
        XTM_BUTTON_CLICK,
        XTM_BUTTON_BACK,
        XTM_BUTTON_FWD,
        XTM_BUTTON_LOOP,
        XTM_BUTTON_STOP,
        XTM_BUTTON_PLAY,
        XTM_BUTTON_REC,
        XTM_BUTTON_TRACK_SOLO,
        XTM_BUTTON_TRACK_MUTE,
        XTM_BUTTON_TRACK_ARM
    ]

    buttons.forEach((button) => {
        this.noteControls[button] = new Button(button, this.app);
    });

    /** Callbacks for buttons */

    /** track volume reset button */
    this.noteControls[XTM_ENC_BUTTON_TRACK_VOLUME].call = function () {
        this.app.cursorTrackController.cursorTrack.volume().value().set(68.6, 128);
    }

    /** track pan reset button */
    this.noteControls[XTM_ENC_BUTTON_TRACK_PAN].call = function () {
        this.app.cursorTrackController.cursorTrack.pan().value().set(127 / 2, 128);
    }

    this.noteControls[XTM_BUTTON_TRACK_PREV].call = function () {
        this.app.cursorTrackController.cursorTrack.selectPrevious();
    }
    this.noteControls[XTM_BUTTON_TRACK_PREV].update = function () {
        currentTrack = this.app.cursorTrackController.getCurrentTrack();
        var name = currentTrack.getName();
        if (name !== null) {
            this.app.host.showPopupNotification(name);
        }
    }

    this.noteControls[XTM_BUTTON_TRACK_NEXT].call = function () {
        this.app.cursorTrackController.cursorTrack.selectNext();
    }
    this.noteControls[XTM_BUTTON_TRACK_NEXT].update = function () {
        currentTrack = this.app.cursorTrackController.getCurrentTrack();
        var name = currentTrack.getName();
        if (name !== null) {
            this.app.host.showPopupNotification(name);
        }
    }

    /** play button */
    this.noteControls[XTM_BUTTON_PLAY].call = function () {
        this.app.transport.play();
    }
    this.noteControls[XTM_BUTTON_PLAY].update = function () {
        var isPlaying = this.app.transport.isPlaying().get();
        if (isPlaying) {
            this.app.sendNote(XTM_BUTTON_PLAY, 127);
        }
    }

    /** stop button */
    this.noteControls[XTM_BUTTON_STOP].call = function () {
        this.app.transport.stop();
    }
    this.noteControls[XTM_BUTTON_STOP].update = function () {
        var isPlaying = this.app.transport.isPlaying().get();
        if (!isPlaying) {
            this.app.sendNote(XTM_BUTTON_PLAY, 0);
        }
    }

    /** forward / rewind buttons (don't need update callbacks) */
    this.noteControls[XTM_BUTTON_FWD].call = function () {
        this.app.transport.fastForward();
    }
    this.noteControls[XTM_BUTTON_BACK].call = function () {
        this.app.transport.rewind();
    }

    /** loop button */
    this.noteControls[XTM_BUTTON_LOOP].call = function () {
        var isLooping = this.app.transport.isArrangerLoopEnabled().get();
        this.app.transport.isArrangerLoopEnabled().set(!isLooping);
    }
    this.noteControls[XTM_BUTTON_LOOP].update = function () {
        var isLooping = this.app.transport.isArrangerLoopEnabled().get();
        if (isLooping) {
            this.app.sendNote(XTM_BUTTON_LOOP, 127);
        }
    }

    /** click (metronome) button */
    this.noteControls[XTM_BUTTON_CLICK].call = function () {
        var isClicking = this.app.transport.isMetronomeEnabled().get();
        this.app.transport.isMetronomeEnabled().set(!isClicking);
    }
    this.noteControls[XTM_BUTTON_CLICK].update = function () {
        var isClicking = this.app.transport.isMetronomeEnabled().get();
        if (isClicking) {
            this.app.sendNote(XTM_BUTTON_CLICK, 127);
        }
    }

    /** record button */
    this.noteControls[XTM_BUTTON_REC].call = function () {
        this.app.transport.record();
    }
    this.noteControls[XTM_BUTTON_REC].update = function () {
        var isArmed = this.app.transport.isArrangerRecordEnabled().get();
        var isPlaying = this.app.transport.isPlaying().get();
        if (isArmed && isPlaying) {
            this.lightUp();
        } else if (isArmed) {
            this.startBlinking();
        } else {
            this.stopBlinking();
        }
    }
    /** track solo button */
    this.noteControls[XTM_BUTTON_TRACK_SOLO].call = function () {
        this.app.cursorTrackController.cursorTrack.solo().set(!this.app.cursorTrackController.cursorTrack.solo().get());
    }
    this.noteControls[XTM_BUTTON_TRACK_SOLO].update = function () {
        var isSolo = this.app.cursorTrackController.cursorTrack.solo().get();
        if (isSolo) {
            this.startBlinking();
        } else {
            this.stopBlinking();
        }
    }

    /** track mute button */
    this.noteControls[XTM_BUTTON_TRACK_MUTE].call = function () {
        this.app.cursorTrackController.cursorTrack.mute().set(!this.app.cursorTrackController.cursorTrack.mute().get());
    }
    this.noteControls[XTM_BUTTON_TRACK_MUTE].update = function () {
        var isMuted = this.app.cursorTrackController.cursorTrack.mute().get();
        if (isMuted) {
            this.startBlinking();
        } else {
            this.stopBlinking();
        }
    }

    /** track arm button */
    this.noteControls[XTM_BUTTON_TRACK_ARM].call = function () {
        this.app.cursorTrackController.cursorTrack.arm().set(!this.app.cursorTrackController.cursorTrack.arm().get());
    }
    this.noteControls[XTM_BUTTON_TRACK_ARM].update = function () {
        var isArrangerArmed = this.app.transport.isArrangerRecordEnabled().get();
        var isArmed = this.app.cursorTrackController.cursorTrack.arm().get();
        var isPlaying = this.app.transport.isPlaying().get();
        if (isArrangerArmed && isArmed && isPlaying) {
            this.lightUp();
        } else if (isArmed) {
            this.startBlinking();
        } else {
            this.stopBlinking();
        }

        // if (isArmed) {
        //     this.startBlinking();
        // } else {
        //     this.stopBlinking();
        // }
    }

    this.app.inputPort.setMidiCallback(
        (status, data1, data2) => {
            if (isChannelController(status)) {
                let control = this.ccControls[data1];
                if (control) {
                    control.call(data2);
                } else {
                    this.app.host.errorln("Control Change command " + data1 + " is not supported");
                    printMidi(status, data1, data2);
                }
            }
            if (isNoteOn(status) && data2 == 127) {
                let control = this.noteControls[data1];
                if (control) {
                    control.call();
                } else {
                    this.app.host.errorln("Note command " + data1 + " is not supported");
                    printMidi(status, data1, data2);
                }
            }
        }
    );
}


function Button(note, app) {

    this.note = note;
    this.app = app;
    this.midiOut = host.getMidiOutPort(0);
    this.blinking = false;
    this.ledOn = false;

    this.call = () => { }
    this.update = () => { }

    this.startBlinking = () => {
        if (this.blinking) return;
        this.blinking = true;
        this.blink();
    }

    this.stopBlinking = () => {
        this.blinking = false;
        this.app.sendNote(this.note, 0);

    }

    this.lightUp = () => {
        this.stopBlinking();
        this.app.sendNote(this.note, 127);
    }

    this.blink = () => {
        if (!this.blinking) return;
        this.app.sendNote(this.note, this.ledOn ? 0 : 127);
        this.ledOn = !this.ledOn;
        this.app.host.scheduleTask(this.blink, 500);
    }

}

function MasterFader(app) {

    this.app = app;

    this.masterVolume = this.app.host.createMasterTrack(0).volume();

    this.call = (value) => {
        this.masterVolume.value().set(value, 128);
    }
    this.update = () => { }

}

function Encoder(cc, app) {

    const ENCODER_BEHAVE_SINGLE = 0;
    const ENCODER_BEHAVE_PAN = 1;
    const ENCODER_BEHAVE_FAN = 2;
    const ENCODER_BEHAVE_SPREAD = 3;
    const ENCODER_BEHAVE_TRIM = 4;

    this.cc = cc;
    this.app = app;

    this.setValue = function (value) {
        app.sendCC(this.cc + 8, value);
    }

    this.setValueBlinking = (value) => {
        this.app.sendCC(this.cc + 8, value + 13);
    }

    this.setOff = () => {
        this.app.sendCC(this.cc + 8, 0);
    }

    this.setAllOn = () => {
        this.app.sendCC(this.cc + 8, 27);
    }

    this.setAllBlinking = () => {
        this.app.sendCC(this.cc + 8, 28);
    }

    this.setBehaviorSingleValue = () => {
        this.app.sendCC(this.cc, ENCODER_BEHAVE_SINGLE);
    }

    this.setBehaviorPan = () => {
        this.app.sendCC(this.cc, ENCODER_BEHAVE_PAN);
    }

    this.setBehaviorFan = () => {
        this.app.sendCC(this.cc, ENCODER_BEHAVE_FAN);
    }

    this.setBehaviorSpread = () => {
        this.app.sendCC(this.cc, ENCODER_BEHAVE_SPREAD);
    }

    this.setBehaviorTrim = () => {
        this.app.sendCC(this.cc, ENCODER_BEHAVE_TRIM);
    }


    this.call = () => { }
    this.update = () => { }

}