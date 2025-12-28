/** 
 * Bitwig Controller Script for Behringer X-Touch Mini
 * (c) 2025 Edouard J. Simon  
 * 
 * Version 0.1
 */

loadAPI(24);
load("XTouchMini.hardware.js");

const XTM_MIDI_OUTPUT_NOTE_CHANNEL = 0x9a;
const XTM_MIDI_OUTPUT_CC_CHANNEL = 12;
const EVENT_TRACK_VOLUME = 'EVENT_TRACK_VOLUME';

// Remove this if you want to be able to use deprecated methods without causing script to stop.
// This is useful during development.
host.setShouldFailOnDeprecatedUse(true);

host.defineController("Behringer", "X-Touch Mini", "0.1", "67752178-2d04-46b5-8b7b-26809f60e571", "Edouard Simon");
host.defineMidiPorts(1, 1);

host.addDeviceNameBasedDiscoveryPair(["X-TOUCH MINI"], ["X-TOUCH MINI"]);


var xtm = null;
var app = null;

function init() {
   app = new ApplicationController(host);
   xtm = new XtmHardware(app);
   println("X-Touch Mini initialized!");
}

function flush() {
   xtm.updateControls();
}

function exit() {
}

function ApplicationController(host) {

   this.host = host;
   this.inputPort = this.host.getMidiInPort(0);
   this.outputPort = this.host.getMidiOutPort(0);
   this.transport = this.host.createTransport();

   this.transport.isPlaying().markInterested();
   this.transport.isArrangerRecordEnabled().markInterested();
   this.transport.isArrangerLoopEnabled().markInterested();
   this.transport.isMetronomeEnabled().markInterested();


   this.cursorTrackController = new CursorTrackController(this);

   this.sendNote = (note, value, channel = 0x9a) => {
      this.outputPort.sendMidi(channel, note, value);
   }

   this.sendCC = (cc, value, channel = XTM_MIDI_OUTPUT_CC_CHANNEL) => {
      this.outputPort.sendMidi(0xB0 | ((channel - 1) & 0x0F), cc & 0x7F, value & 0x7F);
   }

}

function CursorTrackController(app) {
   this.app = app;

   this.cursorTrack = this.app.host.createCursorTrack(1, 0);
   this.cursorTrack.volume().markInterested();
   this.cursorTrack.solo().markInterested();
   this.cursorTrack.mute().markInterested();
   this.cursorTrack.name().markInterested();
   this.cursorTrack.arm().markInterested();


   var currentTrack = (function () {
      var name = { value: null, dirty: false };
      var volume = { value: null, dirty: false };
      var pan = { value: null, dirty: false };

      return {
         setName: function (value) {
            name.value = value;
            name.dirty = true;
         },
         getName: function () {
            if (!name.dirty) return null;
            name.dirty = false;
            return name.value;
         },
         setVolume: function (value) {
            volume.value = value;
            volume.dirty = true;
         },
         getVolume: function () {
            if (!volume.dirty) { return null };
            volume.dirty = false;
            return volume.value;
         },
         setPan: function (value) {
            pan.value = value;
            pan.dirty = true;
         },
         getPan: function () {
            if (!pan.dirty) return null;
            pan.dirty = false;
            return pan.value;
         }
      };
   })();

   this.getCurrentTrack = function () {
      return currentTrack;
   }

   this.cursorTrack.name().addValueObserver(function (name) {
      currentTrack.setName(name);
   });

   this.cursorTrack.volume().value().addValueObserver(128, function (volume) {
      currentTrack.setVolume(volume);
   });


   this.cursorTrack.pan().value().addValueObserver(function (pan) {
      currentTrack.setPan(pan);
   });

}