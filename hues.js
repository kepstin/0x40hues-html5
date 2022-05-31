/* Copyright (c) 2015 Calvin Walton <calvin.walton@kepstin.ca>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

(function() {
  "use strict";
  var self = {
    defaults: {
      respack: encodeURIComponent("0x40 Hues 5.0 Defaults"),
      /* In the default respack, this is "weapon" */
      song: 18,
      image: -1,
      hues: "builtin",
    },

    /* Values are 0: normal, 1: auto, 2: full auto
     * normal never changes image.
     * auto changes image only on song change or loop
     * full auto changes image according to song rhythm
     */
    autoMode: 2,

    /* Whether to draw circles on horizontal/vertical blur */
    trippyMode: false,

    /* All the respacks that are currently loaded
     * Respacks can contain hues, images, and songs. */
    respacks: {},

    /* The currently active list of hues */
    hues: [],
    /* The currently active list of images */
    images: [],
    /* The currently active list of songs */
    songs: [],

    /* Index of the current hue */
    hueIndex: null,
    /* The current hue */
    hue: null,

    /* Index of the currently playing song */
    songIndex: null,
    /* The currently playing song */
    song: null,

    /* Index of the currently visible image */
    imageIndex: null,
    /* The currently visible image */
    image: null,

    /* Handle for the beat analysis animation frame callback. */
    beatAnalysisHandle: null,

    /* Length of a beat in the current song */
    beatDuration: null,
    /* Information about the current beat */
    beat: { time: 0, buildup: null, loop: null, loopCount: 0 },
    /* The beat string, including the current beat */
    beatString: "",
    /* The number of beats in the loop */
    loopBeats: 0,
    /* The number of beats in the build */
    buildupBeats: 0,

    /* Current state of the invert effect */
    inverted: false,

    /* Saved promises that can be used to hook into various loading states. */
    setupPromise: null,

    /* Event listener hookups for UI functionality. */
    eventListeners: {
      /* Loading progress */

      /* callback progressstart()
       * Notify that a loading process has started, and a progress indicator
       * should be displayed.
       *
       * No parameters
       */
      progressstart: [],

      /* callback progress(completedWork, newWork)
       * Update the progress indicator.
       *
       * completedWork: Integer number of jobs completed.
       * newWork: Integer number of new (incomplete) jobs added
       */
      progress: [],

      /* callback progressend()
       * Notify that a loading process has completed.
       * To get the actual status of the process, you have to resolve the
       * promise from the call that initiated the loading process.
       *
       * No parameters
       */
      progressend: [],

      /* callback imageload(imageInfo, blob)
       * Notify that image data has been completely loaded.
       *
       * The UI or effects library will presumably want to take the raw
       * image data from the blob and convert it to whatever internal
       * format is required.
       */
      imageload: [],

      /* callback imageframeload(imageInfo, frameNumber, blob)
       * Notify that data for an image animation frame has been completely
       * loaded.
       *
       * The UI or effects library will presumably want to take the raw
       * image data from the blob and convert it to whatever internal
       * format is required.
       */
      imageframeload: [],

      /* User settings updates */

      /* callback automodechange(autoMode)
       * The "auto mode" (automatic image advance) setting has changed.
       * Only called in response the setAutoMode() function being called.
       *
       * autoMode: The name of the "auto mode" that's been selected.
       */
      automodechange: [],

      /* callback volumechange(muted, gain)
       * The audio volume setting has been changed.
       * Pretty much only called in response to user-initiated volume changes.
       *
       * muted: boolean, whether mute is currently in effect.
       * gain: number, the amount of gain in decibels
       */
      volumechange: [],

      /* Active media and effects */

      /* callback huechange(hueInfo, beatTime, fadeDuration)
       * Called from beat analysis (in request animation frame context) prior
       * to the beat callback if the new effect includes a hue change.
       * Also called during initialization and when loading a respack.
       *
       * hueInfo: Same as the return value of getCurrentHue()
       * beatTime: If the hue change was triggered by a beat effect, the
       *   timestamp that the beat occurred on. Otherwise, null.
       * fadeDuration: If the hue change is the result of a fade effect, the
       *   duration that the fade will last for. Only valid if beatTime is not
       *   null.
       */
      huechange: [],

      /* callback imagechange(imageInfo, beatTime)
       * Indicates that currently displayed image has changed.
       * This callback can be called in multiple contexts, depending on the
       * current "autoMode" setting.
       * If "full auto", this is called from beat analysis (in request
       * animation frame context) prior to the beat callback if the new effect
       * includes an image change.
       * If "auto", this is called during the setup while switching songs.
       * This is also called any time a user-initiated image change is done,
       * via the changeImage(), prevImage(), or nextImage() functions.
       * Also can be called during initialization or when loading a respack.
       *
       * imageInfo: Same as the return value of getCurrentImage()
       * beatTime: If the image change was triggered by a beat effect, the
       *   timestamp that the beat occurred on. Otherwise, null.
       */
      imagechange: [],

      /* callback songchange(songInfo, loopStart, buildStart, beatDuration)
       * Indicated that the currently playing song has changed.
       * This is called any time a user-initiated song change is done, via the
       * changeSong(), prevSong(), or nextSong() functions.
       * Also can be called during initialization or when loading a respack.
       *
       * songInfo: Same as the return value of getCurrentSong()
       * loopStart: Timestamp that the loop (will) start(ed) playing.
       * buildStart: Timestamp that the build (will) start(ed) playing.
       *   If there is no build, this is the same as loopStartTime.
       * beatDuration: Length of one beat character in the rhythm string.
       */
      songchange: [],

      /* callback verticalblureffect(beatTime)
       * Called on the start of a vertical blur effect.
       *
       * beatTime: The timestamp of the beat that the vertical blur occured on.
       */
      verticalblureffect: [],

      /* callback horizontalblureffect(beatTime)
       * Called on the start of a vertical blur effect.
       *
       * beatTime: The timestamp of the beat that the vertical blur occured on.
       */
      horizontalblureffect: [],

      /* callback blackouteffect(blackoutActive, beatTime)
       * Indicates that the current (long) blackout state has changed.
       * This is called from beat analysis (in request animation frame context)
       * prior to the beat callback if the new effect causes a blackout to
       * start or end.
       *
       * blackoutActive: boolean value indicating whether the blackout is
       *   currently active.
       * beatTime: The timestamp of the beat that the blackout occured on.
       */
      blackouteffect: [],

      /* callback whiteouteffect(whiteoutActive, beatTime)
       * Same as blackout, except white.
       * Note that the whiteout is expected to share timers and state with
       * blackout; in particular, doing a whiteout after blackout should
       * not restart the fade but rather instantly switch colors.
       * A whiteout will be cancelled by calling the blackouteffect with
       * blackoutActive=false.
       *
       * whiteoutActive: boolean value indicating whether the blackout is
       *   currently active.
       * beatTime: The timestamp of the beat that the blackout occured on.
       */
      whiteouteffect: [],

      /* callback shortblackouteffect(beatTime, duration)
       * Called on the start of the short blackout "|" beat effect, with the
       * information required to time the short blackout correctly.
       * This is called from beat analysis (in request animation frame context)
       * prior to the beat callback.
       *
       * beatTime: The timestamp of the beat that the short blackout occurred
       *   on.
       * duration: The length of the short blackout. (This is less than the
       *   length of a beat.)
       */
      shortblackouteffect: [],

      /* callback shortwhiteouteffect(beatTime, duration)
       * Called on the start of the short whiteout "!" beat effect, with the
       * information required to time the short whiteout correctly.
       * This is called from beat analysis (in request animation frame context)
       * prior to the beat callback.
       *
       * beatTime: The timestamp of the beat that the short whiteout occurred
       *   on.
       * duration: The length of the short whiteout. (This is less than the
       *   length of a beat.)
       */
      shortwhiteouteffect: [],

      /* callback fadehueeffect(beatTime, duration, startHue, endHue)
       * Called on the start of any of the hue fade effects, with the
       * information needed to time the effect correctly.
       * This is called from beat analysis (in request animation frame context)
       * prior to the beat callback.
       *
       * beatTime: The timestamp of the beat that the fade started on
       * duration: The length of the fade. (This will be a multiple of the
       *   beat duration, with a minimum length of one beat.)
       * startHue: The hue at the start of the fade
       * endHue: The hue at the end of the fade
       */
      fadehueeffect: [],

      /* callback inverteffect(beatTime, inverted)
       * Called when the state of the invert effect has changed
       * This is called from beat analysis (in request animation frame context)
       * prior to the beat callback. It may also be called on song change to
       * reset the inverted state.
       *
       * beatTime: The timestamp of the beat the the invert changed on
       * inverted: A boolean indicating whether the screen is currently
       *   inverted (true) or normal (false)
       */
      inverteffect: [],

      /* callback circleeffect(beatTime, in)
       * Called on the start of a circle effect
       * This is called from beat analysis (in request animation frame context)
       * prior to the beat callback.
       *
       * beatTime: The timestamp of the beat that the circle started on
       * in: Whether the circle is from outside in (true), or center out (false)
       */
      circleeffect: [],

      /* callback beat(beatInfo)
       * Called when the beat has changed, after all of the callbacks to update
       * effects, but before the frame callback.
       *
       * beatInfo: Same as the return value of getCurrentBeat()
       */
      beat: [],

      /* callback frame(currentTime)
       * Called every frame (request animation frame context), with the
       * timestamp from the audio context, useful for coordinating effect
       * rendering.
       * If a new beat occurred on this frame, this callback is called after
       * all of the effect updates and the beat callback.
       */
      frame: []
    },

    /* Call event listeners
     * First parameter is the name of the event.
     * Any additional parameters after the first are passed throught to the
     * callback function.
     */
    callEventListeners: function(ev) {
      var args = Array.prototype.slice.call(arguments, 1);
      return Promise.all(self.eventListeners[ev].map(function(callback) {
        return callback.apply(null, args);
      }));
    },

    /* User settings accessors */

    /* Hues.setAutoMode(autoMode)
     * Select when to automatically change images.
     *
     * autoMode: One of the following values:
     *     * "normal": Never automatically change images.
     *     * "auto": Change image when the song loops or changes.
     *     * "full auto": Image changes are managed by the song rhythm string.
     *
     * No return value.
     */
    setAutoMode: function(autoMode) {
      switch (autoMode) {
      case "normal": self.autoMode = 0; break;
      case "auto": self.autoMode = 1; break;
      case "full auto": self.autoMode = 2; break;
      default:
        throw Error("Unknown auto mode: " + autoMode);
      }
      self.callEventListeners("automodechange", autoMode);
    },

    /* Hues.getAutoMode()
     * Get the current image changing mode.
     *
     * Returns the string name of the mode (see setAutoMode() for the list)
     */
    getAutoMode: function() {
      switch (self.autoMode) {
      case 0: return "normal";
      case 1: return "auto";
      case 2: return "full auto";
      }
    },

    /* Active media controls */

    /* Hues.prevImage()
     * Switch to the previous image in the active images list.
     * It doesn't make sense to call this if you're in "full auto" mode...
     *
     * No return value.
     */
    prevImage: function() {
      var images = self.images;
      var i = self.imageIndex - 1;
      if (i < 0) {
        i = images.length - 1;
      }

      changeImage(i);
    },

    /* Hues.nextImage()
     * Switch to the next image in the active images list.
     * It doesn't make sense to call this if you're in "full auto" mode...
     *
     * No return value.
     */
    nextImage: function() {
      var images = self.images;
      var i = self.imageIndex + 1;
      if (i >= images.length) {
        i = 0;
      }

      changeImage(i);
    },

    /* Hues.randomSong()
     * Select a new image, randomly.
     *
     * No return value.
     */
    randomSong: function() {
      var songs = self.songs;
      var i;
      if (self.songIndex === null) {
        i = Math.floor(Math.random() * songs.length);
      } else {
        i = Math.floor(Math.random() * (songs.length - 1));
        if (i >= self.songIndex) {
          i += 1;
        }
      }
      changeSong(i);
    },

    /* Effect information accessors */

    /* Hues.getBeatString(length)
     * Get the string of characters representing the rhythm, starting at the
     * current beat.
     *
     * length: Minimum length of the returned string. The rhythm will be looped
     *   until the string is at least this long. Optional, defaults to 256.
     *
     * Returns a string of beat characters - unless no song is loaded. In that
     *   case, it returns "" (empty string).
     */
    getBeatString: function() {
      var length = arguments[0];
      if (typeof(length) === "undefined") {
        length = 256;
      }
      var song = self.song;
      var beatString = "";
      if (song) {
        beatString = self.beatString;
        while (beatString.length < length) {
          beatString += song.rhythm;
        }
      }

      return beatString;
    },

    /* Analysis helper functions */

    updateBeatString: function() {
      var song = self.song;
      if (!song) {
        self.beatString = "";
        return;
      }

      var beatString = "";
      var beat = self.beat;

      if (beat.buildup !== null &&
          (typeof(song.buildupRhythm) !== "undefined") ) {
          /* Currently in buildup */
        beatString += song.buildupRhythm.slice(beat.buildup);
      } else if (beat.loop !== null) {
        beatString += song.rhythm.slice(beat.loop);
      }

      /* Add a copy of the loop rhythm to make sure fades calculate correctly */
      beatString += song.rhythm;

      self.beatString = beatString;
    },

    /* Promise accessors */

    setupComplete: function() {
      return self.setupPromise;
    }
  };



  /* Hues.addHues(respackName, [huesList])
   * Add hues from a loaded respack to the active hues list.
   * 
   * respackName: Name of respack to load hues from.
   * huesList: (optional) List of indexes of particular hues to load from
   *     the respack
   *
   * Throws Error when the requested respack isn't loaded, doesn't
   * contain hues, or you ask for hues that aren't in the respack.
   *
   * No return value.
   */
  var addHues = function(respackName) {
    var huesList = arguments[1];

    var respack = self["respacks"][respackName];
    if (typeof(respack) === "undefined") {
      throw Error("Unknown respack: " + respackName);
    };

    var hues = respack["hues"];
    if (typeof(hues) === "undefined") {
      throw Error("Respack does not contain hues: " + respackName);
    };

    var addHue = function(hue) {
      /* Avoid duplicate hues; skip a hue if it's already in the list */
      var hues = self["hues"];
      var i = hues.indexOf(hue);
      if (i < 0) {
        hues.push(hue);
      }
    };

    if (typeof(huesList) !== "undefined") {
      huesList.forEach(function(hueIndex) {
        addHue(hues[hueIndex]);
      });
    } else {
      hues.forEach(addHue);
    }
  };

  /* Hues.addSongs(respackName, [songsList])
   * Add songs from a loaded respack to the active songs list.
   * 
   * respackName: Name of respack to load songs from.
   * songsList: (optional) List of indexes of particular songs to load from
   *     the respack
   *
   * Throws Error when the requested respack isn't loaded, doesn't
   * contain songs, or you ask for songs that aren't in the respack.
   *
   * No return value.
   */
  var addSongs = function(respackName) {
    var songsList = arguments[1];

    var respack = self["respacks"][respackName];
    if (typeof(respack) === "undefined") {
      throw Error("Unknown respack: " + respackName);
    };

    var songs = respack["songs"];
    if (typeof(songs) === "undefined") {
      throw Error("Respack does not contain songs: " + respackName);
    };

    var addSong = function(song) {
      /* Avoid duplicate songs; skip a song if it's already in the list */
      var songs = self["songs"];
      var i = songs.indexOf(song);
      if (i < 0) {
        songs.push(song);
      }
    };

    if (typeof(songsList) !== "undefined") {
      songsList.forEach(function(songIndex) {
        addSong(songs[songIndex]);
      });
    } else {
      songs.forEach(addSong);
    }
  };

  /* Hues.playSong()
   * Start playing the currently selected song.
   *
   * Returns a promise that will resolve once the song is playing, and will
   * reject if playback fails.
   */
  var playSong = function() {
    return changeSong(self["songIndex"]);
  }

  /* Hues.prevSong()
   * Switch to the previous song (wraps) and start playing it.
   *
   * Returns a promise that will resolve once the song is playing, and will
   * reject if playback fails.
   */
  var prevSong = function() {
    var i = self["songIndex"];
    i -= 1;
    if (i < 0) {
      i = self["songs"].length - 1;
    }
    return changeSong(i);
  }

  /* Hues.nextSong()
   * Switch to the next song (wraps) and start playing it.
   *
   * Returns a promise that will resolve once the song is playing, and will
   * reject if playback fails.
   */
  var nextSong = function() {
    var i = self["songIndex"];
    i += 1;
    if (i >= self["songs"].length) {
      i = 0;
    }
    return changeSong(i);
  }

  /* Hues.addImages(respackName, [imagesList])
   * Add images from a loaded respack to the active images list.
   * 
   * respackName: Name of respack to load songs from.
   * imagesList: (optional) List of indexes of particular images to load from
   *     the respack
   *
   * Throws Error when the requested respack isn't loaded, doesn't
   * contain images, or you ask for images that aren't in the respack.
   *
   * No return value.
   */
  var addImages = function(respackName) {
    var imagesList = arguments[1];

    var respack = self["respacks"][respackName];
    if (typeof(respack) === "undefined") {
      throw Error("Unknown respack: " + respackName);
    };

    var images = respack["images"];
    if (typeof(images) === "undefined") {
      throw Error("Respack does not contain images: " + respackName);
    };

    var addImage = function(image) {
      /* Avoid duplicate images; skip an image if it's already in the list */
      var images = self["images"];
      var i = images.indexOf(image);
      if (i < 0) {
        images.push(image);
      }
    };

    if (typeof(imagesList) !== "undefined") {
      imagesList.forEach(function(imageIndex) {
        addImage(images[imageIndex]);
      });
    } else {
      images.forEach(addImage);
    }
  };

  /* Hues.changeImage(imageIndex)
   * Change the image to one at a particular index
   *
   * No return value.
   */
  var changeImage = function(imageIndex) {
    var images = self["images"];
    var image = images[imageIndex];
    if (typeof(image) === "undefined") {
      throw Error("Image index " + imageIndex + " out of range");
    }

    self["imageIndex"] = imageIndex;
    self["image"] = image;

    self.callEventListeners("imagechange", image, audioCtx.currentTime);
  }

  /* Hues.randomImage()
   * Select a new image, randomly.
   *
   * No return value.
   */
  var randomImage = function() {
    var images = self["images"];
    var i;
    if (self["imageIndex"] === null) {
      i = Math.floor(Math.random() * images.length);
    } else if (images.length > 1) {
      i = Math.floor(Math.random() * (images.length - 1));
      if (i >= self["imageIndex"]) {
        i += 1;
      }
    } else {
      i = 0;
    }
    changeImage(i);
  }

  /* Hues.getCurrentImage()
   * Get the currently visible image.
   *
   * Returns the image info object, or null if no image visible.
   */
  var getCurrentImage = function() {
    return self["image"];
  }

  /* Hues.addEventListener(event, callback)
   * Add a listener for an event generated by the Hues core.
   *
   * Note that this function allows you to add the same callback multiple
   * times.
   *
   * event: Name of the event
   * callback: Function to call when event fires
   *
   * Throws an error if you attempt to add a listener to an undefined event.
   *
   * No return value.
   */
  var addEventListener = function(ev, callback) {
    ev = ev.toLowerCase();
    if (typeof(self["eventListeners"][ev]) !== "undefined") {
      self["eventListeners"][ev].push(callback);
    } else {
      throw Error("Unknown event: " + ev);
    }
  };

  /* Hues.removeEventListener(event, callback)
   * Disable an event listener, removing the callback function.
   *
   * Note that if the callback was in the list multiple times, all instances
   * will be removed.
   *
   * event: Name of the event
   * callback: Function to call when event fires
   *
   * Throws an error if you attempt to remove a listener from an undefined
   * event.
   */
  var removeEventListener = function(ev, callback) {
    ev = ev.toLowerCase();
    if (typeof(self["eventListeners"][ev]) !== "undefined") {
      self["eventListeners"][ev] =
          self["eventListeners"][ev].filter(function(a) {
        return (a !== callback);
      });
    } else {
      throw Error("Unknown event: " + ev);
    }
  };

  /* Load configuration, which is set in a global (window) object */
  (function() {
    var respack = window.huesConfig.respack;
    if (typeof(respack) !== 'undefined') {
      console.log("huesConfig respack: " + respack);
      self.defaults.respack = respack;
    }

    var song = window.huesConfig.defaultSong;
    if (typeof(song) !== 'undefined') {
      self.defaults.song = song;
    }

    var image = window.huesConfig.defaultImage;
    if (typeof(image) !== 'undefined') {
      self.defaults.image = image;
    }

    var autoMode = window.huesConfig["autoMode"];
    if (typeof(autoMode) !== 'undefined') {
      self.setAutoMode(autoMode);
    }

    var trippyMode = window.huesConfig["trippyMode"];
    if (typeof(trippyMode) !== 'undefined') {
      self.trippyMode = !!trippyMode;
    }
  })();

  /* The public object */
  var Hues = {
    setAutoMode: self.setAutoMode,
    getAutoMode: self.getAutoMode,
    prevImage: self.prevImage,
    nextImage: self.nextImage,
    randomSong: self.randomSong,
    getBeatString: self.getBeatString,
    setupComplete: self.setupComplete,
    addHues: addHues,
    addSongs: addSongs,
    playSong: playSong,
    prevSong: prevSong,
    nextSong: nextSong,
    addImages: addImages,
    changeImage: changeImage,
    randomImage: randomImage,
    getCurrentImage: getCurrentImage,
    addEventListener: addEventListener,
    removeEventListener: removeEventListener
  };




  var audioCtx = new AudioContext;
  var currentBuildupSource = null;
  var currentBuildupBuffer = null;
  var currentBuildupStartTime = null;
  var currentLoopSource = null;
  var currentLoopBuffer = null;
  var currentLoopStartTime = null;

  var gainNode = audioCtx.createGain();
  gainNode.connect(audioCtx.destination);

  var muted = false;
  if (localStorage.getItem('Hues.muted') === "true") {
    muted = true;
  }
  var savedGain = parseFloat(localStorage.getItem('Hues.gain'));
  if (savedGain === null || isNaN(savedGain)) {
    savedGain = -10.0;
  }

  var clampGain = function() {
    if (savedGain < -80) {
      savedGain = -80;
    } else if (savedGain > 5) {
      savedGain = 5;
    }
  };
  var dbToVolume = function(db) {
    return Math.pow(10, db / 20);
  };

  clampGain();
  if (muted) {
    gainNode.gain.value = 0;
  } else {
    gainNode.gain.value = dbToVolume(savedGain);
  }

  addEventListener('volumechange', function(muted, gain) {
    localStorage.setItem('Hues.muted', muted);
    localStorage.setItem('Hues.gain', gain);
  });

  Hues["respack"] = {};

  var isMuted = function() {
    return muted;
  };
  Hues["isMuted"] = isMuted;
  var getVolume = function() {
    return savedGain;
  };
  Hues.getVolume = getVolume;
  var mute = function() {
    if (!muted) {
      muted = true;
      gainNode.gain.value = 0;
      self.callEventListeners('volumechange', muted, savedGain);
    }
  };
  Hues["mute"] = mute;
  var unmute = function() {
    if (muted) {
      muted = false;
      gainNode.gain.value = dbToVolume(savedGain);
      self.callEventListeners('volumechange', muted, savedGain);
    }
  };
  Hues["unmute"] = unmute;

  var setVolume = function(db) {
    savedGain = db;
    clampGain();
    if (!muted) {
      gainNode.gain.value = dbToVolume(savedGain);
    }
    self.callEventListeners('volumechange', muted, savedGain);
  };
  Hues.setVolume = setVolume;

  var adjustVolume = function(db) {
    savedGain += db;
    clampGain();
    if (!muted) {
      gainNode.gain.value = dbToVolume(savedGain);
    }
    self.callEventListeners('volumechange', muted, savedGain);
  };
  Hues.adjustVolume = adjustVolume;


  var loadRespackInfo = function(respack) {
    return new Promise(function(resolve, reject) {
      fetch(respack["uri"] + "/info.xml")
      .catch(reject)
      .then(function(response) {

        if (!response.ok) {
          reject(Error("Could not fetch respack info.xml: " +
                response.status + " " + response.statusText));
          return;
        }

        response.text()
        .catch(reject)
        .then(function(bodyText) {
          var parser = new DOMParser();
          var doc = parser.parseFromString(bodyText, "application/xml");
          var iterator = doc.evaluate("/info/*", doc, null,
              XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);
          var node = iterator.iterateNext();
          while (node) {
            respack[node.localName] = node.textContent;
            node = iterator.iterateNext();
          }
          resolve(respack);
        });
      });
    });
  };

  var loadRespackHues = function(respack) {
    return new Promise(function(resolve, reject) {
      fetch(respack["uri"] + "/hues.xml")
      .catch(reject)
      .then(function(response) {
        
        if (response.status == 404) {
          resolve(respack);
          return;
        }
        
        if (!response.ok) {
          reject(Error("Could not fetch respack hues.xml: " +
                response.status + " " + response.statusText));
          return;
        }

        response.text()
        .catch(reject)
        .then(function(bodyText) {
          respack["hues"] = [];

          var parser = new DOMParser();
          var doc = parser.parseFromString(bodyText, "application/xml");
          var iterator = doc.evaluate("/hues/hue", doc, null,
              XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
          var node = iterator.iterateNext();
          while (node) {
            var hue = {};
            hue["name"] = node.getAttribute("name");
            var hex = node.textContent;
            if (!hex[0] == "#") {
              hex = "#" + hex;
            }
            hue["hex"] = hex;

            /* The effects need the hue value as r,g,b floating-point */
            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            if (!result) {
              throw Error("Could not parse color value for " + name + ": " +
                  hex);
            }
            hue["rgb"] = [
              parseInt(result[1], 16) / 255,
              parseInt(result[2], 16) / 255,
              parseInt(result[3], 16) / 255
            ];


            respack["hues"].push(hue);

            node = iterator.iterateNext();
          };

          resolve(respack);
        });
      });
    });
  }

  var loadRespackSongTrackFetch = function(uri) {
    return new Promise(function(resolve, reject) {
      fetch(uri)
      .then(function(response) {
        if (!response.ok) {
          reject(Error("Failed to fetch " + uri + ": " +
                response.status + " " + response.statusText));
          return;
        }
        resolve(response.arrayBuffer())
      })
      .catch(reject)
    });
  }

  var loadRespackSongTrackDecode = function(buffer) {
    return new Promise(function(resolve, reject) {
      audioCtx.decodeAudioData(buffer, function(audioBuffer) {
        resolve(audioBuffer);
      }, function(error) {
        reject(Error("Could not decode audio: " + error));
      });
    });
  }

  var loadRespackSongTrack = function(uri) {
    return new Promise(function(resolve, reject) {
      loadRespackSongTrackFetch(uri + ".opus")
      .then(loadRespackSongTrackDecode)
      .then(resolve)
      .catch(function(error) {
        console.log("opus failed to load", error);
        loadRespackSongTrackFetch(uri + ".ogg")
        .then(loadRespackSongTrackDecode)
        .then(resolve)
        .catch(function() {
          console.log("ogg failed to load: ", error);
          loadRespackSongTrackFetch(uri + ".mp3")
          .then(loadRespackSongTrackDecode)
          .then(resolve)
          .catch(function() {
            console.log("mp3 failed to load: ", error);
            reject(Error("Could not find any supported audio track formats"));
          });
        });
      });
    });
  }

  var loadRespackSongLoop = function(respack, song) {
    return new Promise(function(resolve, reject) {
      var uri = respack["uri"] + "/Songs/" + encodeURIComponent(song["loop"]);
      loadRespackSongTrack(uri)
      .catch(reject)
      .then(function(audioBuffer) {
        song["loopBuffer"] = audioBuffer;
        resolve(song);
      });
    });
  };

  var loadRespackSongBuildup = function(respack, song) {
    return new Promise(function(resolve, reject) {
      if (!song["buildup"]) {
        resolve(song);
        return;
      }

      var uri = respack["uri"] + "/Songs/" +
            encodeURIComponent(song["buildup"]);
      loadRespackSongTrack(uri)
      .catch(reject)
      .then(function(audioBuffer) {
        song["buildupBuffer"] = audioBuffer;
        resolve(song);
      });
    });
  }

  var loadRespackSongMedia = function(respack, song) {
    var loop = loadRespackSongLoop(respack, song);
    var buildup = loadRespackSongBuildup(respack, song);
    return Promise.all([loop, buildup]).then(function() {
      return Promise.resolve(song)
    });
  }

  var loadRespackSongs = function(respack) {
    return new Promise(function(resolve, reject) {
      fetch(respack["uri"] + "/songs.xml")
      .catch(reject)
      .then(function(response) {
        
        if (response.status == 404) {
          resolve(respack);
          return;
        }
        
        if (!response.ok) {
          reject(Error("Could not fetch respack songs.xml: " +
                response.status + " " + response.statusText));
          return;
        }

        response.text()
        .catch(reject)
        .then(function(bodyText) {
          respack["songs"] = [];
          var songPromises = [];

          var parser = new DOMParser();
          var doc = parser.parseFromString(bodyText, "application/xml");
          var iterator = doc.evaluate("/songs/song", doc, null,
              XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
          var node = iterator.iterateNext();
          while (node) {
            var song = {};
            song["loop"] = node.getAttribute("name");

            var songIterator = doc.evaluate("*", node, null,
                XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);
            var songNode = songIterator.iterateNext();
            while (songNode) {
              song[songNode.localName] = songNode.textContent;
              songNode = songIterator.iterateNext();
            }

            /* Replace U+2011 NON-BREAKING HYPHEN with standard hyphen.
             * For bug compatibility with Xmas respack */
            song.rhythm = song.rhythm.replace(/‑/g, '-');
            if (song.buildupRhythm) {
              song.buildupRhythm = song.buildupRhythm.replace(/‑/g, '-');
            }

            respack["songs"].push(song);
            self.callEventListeners("progress", 0, 1);
            songPromises.push(loadRespackSongMedia(respack, song)
              .then(function() {
                self.callEventListeners("progress", 1, 0);
              })
            );

            node = iterator.iterateNext();
          };

          Promise.all(songPromises).then(function() {
            resolve(respack);
          }).catch(reject);
        });
      });
    });
  }

  var loadRespackImageFetch = function(uri) {
    return new Promise(function(resolve, reject) {
      fetch(uri)
      .catch(reject)
      .then(function(response) {
        if (!response.ok) {
          reject(response.status);
          return;
        }
        resolve(response);
      });
    });
  }

  var loadRespackImageAnimationFrame = function(respack, image, i) {
    return new Promise(function(resolve, reject) {
      var name = encodeURIComponent(image["name"]);
      var number = i.toString();
      if (number.length < 2) {
        number = "0" + number;
      }
      loadRespackImageFetch(respack["uri"] + "/Animations/" +
          name + "/" + name + "_" + number + ".png")
      .catch(function() {
        return loadRespackImageFetch(respack["uri"] + "/Images/" +
            name + "/" + name + "_" + number + ".png")
      })
      .then(function(response) { return response.blob() })
      .then(function(blob) {
        image.frames = i;
        var next = loadRespackImageAnimationFrame(respack, image, i + 1);
        Promise.resolve(self.callEventListeners("imageframeload", image, i, blob))
        .then(function() {
          resolve(next);
        })
        .catch(reject);
      })
      .catch(function(error) {
        if (error === 404) {
          console.log("If you got a 404 error there it was expected and " +
                "unavoidable... You can just ignore it.");
          resolve(image);
        } else {
          reject(error)
        }
      })
    });
  }

  var loadRespackImageAnimationFrame2 = function(respack, image, i) {
    return new Promise(function(resolve, reject) {
      var name = encodeURIComponent(image["name"]);
      var number = i.toString();
      if (number.length < 2) {
        number = "0" + number;
      }
      loadRespackImageFetch(respack["uri"] + "/Animations/" +
          name + "/" + name + "_" + number + ".png")
      .catch(function() {
        return loadRespackImageFetch(respack["uri"] + "/Images/" +
            name + "/" + name + "_" + number + ".png")
      })
      .then(function(response) { return response.blob() })
      .then(function(blob) {
        image.frames = i;
        Promise.resolve(self.callEventListeners("imageframeload", image, i, blob))
        .then(function() {
          resolve(image);
        })
        .catch(reject);
      })
      .catch(reject);
    });
  }

  var loadRespackImageAnimation = function(respack, image) {
    console.log("Starting animation load for " + image.name);
    return new Promise(function(resolve, reject) {
      image.frames = parseInt(image.frames);
      if (isFinite(image.frames)) {
        // This is an enhanced respack that includes frame counts! Yay!
        // We can parallel load the images here, and give better progress
        // indication.
        var promises = [];

        self.callEventListeners("progress", 0, image.frames);
        for (var i = 1; i <= image.frames; i++) {
          promises.push(
            loadRespackImageAnimationFrame2(respack, image, i)
            .then(function() {
              self.callEventListeners("progress", 1, 0);
            })
            .catch(function(er) {
              console.log(er);
              return Promise.reject(er);
            })
          );
        }

	Promise.all(promises)
        .then(resolve)
        .catch(function(error) {
          if (error === 404) {
            resolve(new Error("Some animation frames for " + image.name +
                    " failed to load"));
          } else {
            reject(error);
          }
        });
      } else {
        // Standard respack animations are a bit tricky, since the xml file
        // doesn't say how many frames there are. We have to fetch them until
        // we hit a missing file...
        image.frames = 0;
        var i = 1;

        loadRespackImageAnimationFrame(respack, image, i)
        .catch(reject)
        .then(function() {
          if (image.frames == 0) {
            reject(Error("Animation for image " + image["name"] + " in " +
                  respack["name"] + " had no frames load"));
          } else {
            resolve(image);
          }
        });
      }
    });
  }

  var loadRespackImageSingle = function(respack, image) {
    return new Promise(function(resolve, reject) {
      var name = encodeURIComponent(image["name"]);
      loadRespackImageFetch(respack["uri"] + "/Images/" + name + ".png")
      .then(function(response) { return response.blob() })
      .then(function(blob) {
        Promise.resolve(self.callEventListeners("imageload", image, blob))
        .then(function() {
          resolve(image);
        });
      })
      .catch(reject);
    });
  }

  var loadRespackImageMedia = function(respack, image) {
    if (image["frameDuration"]) {
      return loadRespackImageAnimation(respack, image);
    } else {
      return loadRespackImageSingle(respack, image);
    }
  }

  var loadRespackImages = function(respack) {
    return new Promise(function(resolve, reject) {
      fetch(respack["uri"] + "/images.xml")
      .catch(reject)
      .then(function(response) {
        
        if (response.status == 404) {
          resolve(respack);
          return;
        }
        
        if (!response.ok) {
          reject(Error("Could not fetch respack images.xml: " +
                response.status + " " + response.statusText));
          return;
        }

        response.text()
        .catch(reject)
        .then(function(bodyText) {
          respack["images"] = [];
          var imagePromises = [];

          var parser = new DOMParser();
          var doc = parser.parseFromString(bodyText, "application/xml");
          var iterator = doc.evaluate("/images/image", doc, null,
              XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
          var node = iterator.iterateNext();
          while (node) {
            var image = {};
            image["name"] = node.getAttribute("name");

            var imageIterator = doc.evaluate("*", node, null,
                XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);
            var imageNode = imageIterator.iterateNext();
            while (imageNode) {
              image[imageNode.localName] = imageNode.textContent;
              imageNode = imageIterator.iterateNext();
            }

            respack["images"].push(image);
            self.callEventListeners("progress", 0, 1);
            imagePromises.push(loadRespackImageMedia(respack, image)
              .then(function() {
                self.callEventListeners("progress", 1, 0);
              })
            );

            node = iterator.iterateNext();
          };

          Promise.all(imagePromises).then(function() {
            resolve(respack);
          }).catch(reject);

        });
      });
    });
  }

  var loadRespack = function(uri) {
    return new Promise(function(resolve, reject) {
      // Strip a trailing /, since we're going to be generating uris with this
      // as the base.
      if (uri.slice(-1) == "/") {
        uri = uri.slice(0, -1);
      }
      if (uri.indexOf(":") < 0) {
        uri = "respacks/" + uri;
      }
      var respack = {
        "uri": uri
      };

      console.log("Loading respack at " + uri);
      self.callEventListeners("progress", 0, 4);

      var respackInfo = loadRespackInfo(respack);
      
      respackInfo.then(function(respack) {
        console.log("Loaded respack info for " + respack["name"]);
        self.callEventListeners("progress", 1, 0);
      });

      var respackHues = respackInfo.then(loadRespackHues);
      respackHues.then(function(respack) {
        if (respack["hues"]) {
          console.log("Loaded " + respack["hues"].length +
              " hues from " + respack["name"]);
        } else {
          console.log("Respack contains no hues: " + respack["name"]);
        }
        self.callEventListeners("progress", 1, 0);
      });

      var respackSongs = respackInfo.then(loadRespackSongs);
      respackSongs.then(function(respack) {
        if (respack["songs"]) {
          console.log("Loaded " + respack["songs"].length +
              " songs from " + respack["name"]);
        } else {
          console.log("Respack contains no songs: " + respack["name"]);
        }
        self.callEventListeners("progress", 1, 0);
      });

      var respackImages = respackInfo.then(loadRespackImages);
      respackImages.then(function(respack) {
        if (respack["images"]) {
          console.log("Loaded " + respack["images"].length +
              " images from " + respack["name"]);
        } else {
          console.log("Respack has no images: " + respack["name"]);
        }
        self.callEventListeners("progress", 1, 0);
      });
      Promise.all([respackHues, respackSongs, respackImages])
      .catch(reject)
      .then(function() {
        console.log("All content from respack " + respack["name"] +
            " has loaded");
        self["respacks"][respack["name"]] = respack;
        resolve(respack);
      });

    });
  }
  Hues["loadRespack"] = loadRespack;

  // Do core initialization, loading "builtin" data and requested respacks
  var initializePromise = null;
  Hues.initialize = function(options) {
    if (!initializePromise) {
      initializePromise = new Promise(function (resolve, reject) {
        self.callEventListeners("progressstart");

        var builtinPromise = loadRespack("builtin");

        var optRespack = options.respack;
        if (typeof(optRespack) === 'undefined') {
          optRespack = self.defaults.respack;
        }

        var respacks = [].concat(optRespack);
        var respackPromises = [builtinPromise];

        for (var i = 0; i < respacks.length; i++) {
          console.log("Loading respack " + respacks[i]);
          respackPromises.push(loadRespack(respacks[i]));
        }

        var setupPromise = Promise.all(respackPromises)
        .then(function(respacks) {
          var builtin = respacks.shift();

          var haveHues = false;
          for (var i = 0; i < respacks.length; i++) {
            var respack = respacks[i];
            if (respack.hues) {
              addHues(respack.name);
              haveHues = true;
            }
            if (respack.songs) {
              addSongs(respack.name);
            }
            if (respack.images) {
              addImages(respack.name);
            }
          }

          if (!haveHues) {
            addHues(builtin.name);
          }
          console.log("Loaded hues:");
          console.log(self["hues"]);
          var hue = options.hue;
          if (typeof(hue) === 'undefined') {
            hue = 0x40 - 1;
          }
          if (hue === -1) {
            randomHue();
          } else {
            changeHue(hue);
          }

          console.log("Loaded songs:");
          console.log(self["songs"]);
          /* Preset the selected song */
          var song = options.song;
          if (typeof(song) === 'undefined') {
            song = 0;
          }
          self.songIndex = song;
          self.song = self.songs[song];

          console.log("Loaded images:");
          console.log(self["images"]);
          /* Preset the selected image */
          var image = options.image;
          if (typeof(image) === 'undefined') {
            image = 0;
          }
          if (image === -1) {
            randomImage();
          } else {
            changeImage(image);
          }

          self.callEventListeners("progressend");
        });

        resolve(setupPromise);
      });
    }
    return initializePromise;
  }

  var dumpRespackAnimation = function(img, image) {
    var i = 0;
    img.src = URL.createObjectURL(image["animation"][i]);

    setInterval(function() {
      i = i + 1;
      if (i >= image["animation"].length) {
        i = 0;
      }
      img.src = URL.createObjectURL(image["animation"][i]);
    }, image["frameDuration"]);
  }

  var stopSong = function() {
    console.log("Stopping playback");

    if (currentLoopSource) {
      currentLoopSource.stop();
      currentLoopSource.disconnect();
      currentLoopSource = null;
    }
    if (currentLoopBuffer) {
      currentLoopBuffer = null;
    }
    if (currentBuildupSource) {
      currentBuildupSource.stop();
      currentBuildupSource.disconnect();
      currentBuildupSource = null;
    }
    if (currentBuildupBuffer) {
      currentBuildupBuffer = null;
    }

    stopBeatAnalysis();
  }
  Hues["stopSong"] = stopSong;

  var changeSong = function(songIndex) {
    stopSong();

    console.log("New song index is " + songIndex);
    var song = self["songs"][songIndex];
    self["songIndex"] = songIndex;
    self["song"] = song;

    console.log("Switching to " + song["title"]);

    var buildupBuffer = song["buildupBuffer"];
    var buildupDuration = 0;
    var buildupSource = null;
    if (buildupBuffer && buildupBuffer.length > 0) {
      buildupDuration = buildupBuffer.duration;
      buildupSource = audioCtx.createBufferSource();
      buildupSource.buffer = buildupBuffer;
      buildupSource.connect(gainNode);
    }

    var loopBuffer = song["loopBuffer"];
    var loopDuration = loopBuffer.duration;
    var loopSource = audioCtx.createBufferSource();
    loopSource.buffer = loopBuffer;
    loopSource.loop = true;
    loopSource.connect(gainNode);

    var loopBeats = song["rhythm"].length;
    self["loopBeats"] = loopBeats;
    var beatDuration = loopDuration / loopBeats;
    self["beatDuration"] = beatDuration;
    var buildupBeats = Math.round(buildupDuration / beatDuration);
    self["buildupBeats"] = buildupBeats;

    console.log("Loop duration is " + loopDuration + " (" +
      song["rhythm"].length + " beats)")
    console.log("Beat duration is " + beatDuration);
    console.log("Buildup duration is " + buildupDuration + " (" +
      buildupBeats + " beats)");

    if (buildupBuffer) {
      /* Songs that have buildups might be missing buildupRhythm, or
       * have it too short. Fix that by padding it. */
      if (typeof(song["buildupRhythm"]) !== "undefined") {
        var buildupDelta = Math.round(buildupDuration / beatDuration) - 
          song["buildupRhythm"].length;
        if (buildupDelta > 0) {
          song["buildupRhythm"] += ".".repeat(buildupDelta);
        }
      } else {
        song["buildupRhythm"] = ".".repeat(
            Math.round(buildupDuration / beatDuration));
      }
    }

    if (buildupSource) {
      currentBuildupSource = buildupSource;
      currentBuildupBuffer = buildupBuffer;
    }
    currentLoopSource = loopSource;
    currentLoopBuffer = loopBuffer;

    var loopStart;
    var buildupStart;

    var startPlayback = function() {
      buildupStart = audioCtx.currentTime;
      loopStart = buildupStart + buildupDuration;
      if (buildupSource) {
        buildupSource.start(buildupStart);
      }
      loopSource.start(loopStart);

      currentBuildupStartTime = buildupStart;
      currentLoopStartTime = loopStart;

      self.updateBeatString();
      startBeatAnalysis();

      self.callEventListeners("songchange",
          song, loopStart, buildupStart, beatDuration);
      self.callEventListeners("imagechange", self.image, audioCtx.currentTime);
      self.inverted = false;
      self.callEventListeners("inverteffect",
          audioCtx.currenTime, self.inverted);
    }

    var suspend = Promise.resolve()
    if (audioCtx.suspend && audioCtx.resume) {
      suspend = audioCtx.suspend();
    }

    var playback = suspend.then(startPlayback);

    var resume;
    if (audioCtx.suspend && audioCtx.resume) {
      resume = playback.then(function() {return audioCtx.resume()});
    } else {
      resume = playback;
    }

    return resume.then(function() {
      return song;
    });
  };
  Hues["changeSong"] = changeSong;


  var getCurrentSong = function() {
    return self["song"];
  }
  Hues["getCurrentSong"] = getCurrentSong;

  var getCurrentHue = function() {
    var index = self["hueIndex"];
    var hue = self["hue"];
    return {"index": index, "hue": hue};
  };
  Hues["getCurrentHue"] = getCurrentHue;

  var changeHue = function(hueIndex) {
    var hues = self.hues;
    if (hueIndex < 0) {
      hueIndex = 0;
    }
    if (hueIndex >= hues.length) {
      hueIndex = hues.length - 1;
    }
    var hue = hues[hueIndex];
    self.hueIndex = hueIndex;
    self.hue = hue;
    self.callEventListeners("huechange", {"index": hueIndex, "hue": hue});
  }

  var randomHue = function() {
    var hues = self["hues"];
    var index = self["hueIndex"];
    var newIndex;
    if (index === null) {
      newIndex = Math.floor(Math.random() * hues.length);
    } else {
      newIndex = Math.floor(Math.random() * (hues.length - 1));
      if (newIndex >= index) {
        newIndex += 1;
      }
    }
    changeHue(newIndex);
  }


  var doBeatEffect = function() {
    var beatString = self.beatString;
    if (beatString == "") {
      return;
    }

    var beat = self.beat;
    var current = beatString[0];
    var rest = beatString.slice(1);

    /* . is the null character, no effect. */
    if (current == ".") {
      return;
    }

    /* All non-null beat characters cancel blackout - except blackouts */
    if (!(current == '+' || current == '|' || current == '¤')) {
      self.callEventListeners("blackouteffect", false, beat.time);
    }

    /* Here's the current annotated list of beat effects:
     *
     * "x": Vertical blur (snare)
     *   Changes color.
     *   Changes image on full auto.
     * "o": Horizontal blur (bass)
     *   Changes color.
     *   Changes image on full auto.
     * "-": No blur
     *   Changes color.
     *   Changes image on full auto.
     * "+": Blackout
     *   Blackout lasts until the next non-null effect.
     *   Does not change color or image, but it does do a horizontal blur.
     *   Blackout fades in over the course of ~2 frames in the flash
     *   (+0.4 alpha per frame), this works out to be about 40ms at 60fps.
     *   There's no fade-out, the blackout ends instantly.
     * "¤": Whiteout
     *   Same as +, but with white rather than black. All the timers, etc.,
     *   are shared with blackout.
     * "|": Short blackout
     *   A blackout that only covers part of a single beat.
     *   It changes the color and image, but it does not do any blur.
     *   It has the same fade-in and lack of fade-out as standard blackout.
     *   Note that due to the fade-in, the new image and color are visible for
     *   a couple of frames at the start of the effect.
     *   The length of the blackout is 1/1.7 of the beat length.
     * "!": Short whiteout
     *   Same as |, but with white rather than black.
     * ":": Color only
     * "*": Image only
     * "X": Vertical blur only
     * "O": Horizontal blur only
     * ")": Trippy circle in and change image
     * "(": Trippy circle out and change image
     * ">": Trippy circle in
     * "<": Trippy circle out
     * "~": Fade color
     *   Color change only.
     *   Instead of being immediate, the color is faded from the previous
     *   to new color.
     *   The duration of the fade is until the start of the next non-null
     *   effect.
     * "=": Fade and change image
     *   Same as "~", but in addition the image is changed (at the start of the
     *   effect).
     * "i": Invert all colors
     *   Toggles between normal and inverted states.
     * "I": Invert & change image
     *   Same as "i", bit in addition the image is changed.
     * "s": Horizontal slice (not implemented)
     * "S": Horizontal slice and change image (not implemented)
     * "v": Vertical slice (not implemented)
     * "V": Vertical slice and change image (not implemented)
     * "#": Double slice (not implemented)
     * "@": Double slice and change image (not implemented)
     * "←", "↓", "↑", "→": Shutter (not implemented)
     */

    /* Effects that cause vertical blur */
    if (current == "x" || current == "X") {
      self.callEventListeners("verticalblureffect", beat.time);
    }

    /* Effects that cause horizontal blur */
    if (current == "o" || current == "O" || current == "+") {
      self.callEventListeners("horizontalblureffect", beat.time);
    }

    /* Effects that cause color change */
    if (current == "x" || current == "o" ||
        current == "-" || current == "|" || current == ":") {
      randomHue();
    }

    /* Effects that cause image change on full auto */
    if (self.autoMode == 2 && (
          current == "x" || current == "o" ||
          current == "-" || current == "|" || current == "*" ||
          current == "(" || current == ")" ||
          current == "=" || current == "I" ||
          current == "S" || current == "V" || current == "@")) {
      randomImage();
    }

    /* Standard blackout */
    if (current == "+") {
      self.callEventListeners("blackouteffect", true, beat.time);
    }

    /* Whiteout */
    if (current == "¤") {
      self.callEventListeners("whiteouteffect", true, beat.time);
    }

    /* Short blackout */
    if (current == "|") {
      self.callEventListeners("shortblackouteffect", beat.time, self.beatDuration / 1.7);
    }

    /* Short whiteout */
    if (current == "!") {
      self.callEventListeners("shortwhiteouteffect", beat.time, self.beatDuration / 1.7);
    }

    /* Fade color */
    if (current == "~" || current == "=") {
      var prevHue = self.hue;
      // TODO: This currently calls the huechange callback
      randomHue();
      /* Find the next non-null beat */
      var i = 0;
      for (i = 0; i < rest.length && rest[i] == "."; i++);
      var duration = (i + 1) * self.beatDuration;
      self.callEventListeners("fadehueeffect", beat.time, duration,
          prevHue, self.hue);
    }

    /* Invert toggle */
    if (current == "i" || current == "I") {
      self.inverted = !self.inverted;
      self.callEventListeners("inverteffect", beat.time, self.inverted);
    }

    /* In circle */
    if (current == ")" || current == ">"
        || (self.trippyMode && (current == "o" || current == "O"))) {
      self.callEventListeners("circleeffect", beat.time, /*in=*/true);
    }

    /* Out circle */
    if (current == "(" || current == "<"
        || (self.trippyMode && (current == "x" || current == "X"))) {
      self.callEventListeners("circleeffect", beat.time, /*in=*/false);
    }

  };

  var beatAnalyze = function() {
    if (!currentLoopBuffer) {
      stopBeatAnalysis();
      return;
    }

    var time = audioCtx.currentTime;
    var song = self.song;
    var beat = self.beat;
    var beatDuration = self.beatDuration;

    var loopCount = 0;
    if (time >= currentLoopStartTime) {
      loopCount = Math.floor((time - currentLoopStartTime)
          / currentLoopBuffer.duration);
    }

    if (beat.buildup === null && beat.loop === null) {
      // We haven't played the first beat of the song yet, so initialize
      // for looping...
      if (typeof(song.buildupRhythm) !== "undefined") {
        beat.buildup = -1;
      } else {
        beat.loop = -1;
      }
      beat.time = 0;
      beat.loopCount = 0;

      console.log("build start", currentBuildupStartTime, "loop start", currentLoopStartTime);
    }

    var doBeatActions = function() {
      self.beat = beat;
      self.updateBeatString();

      doBeatEffect();

      self.callEventListeners("beat", beat);
    }

    if (beat.buildup !== null) {
      var nextBeat = { buildup: beat.buildup + 1, loop: null, loopCount: 0 };
      nextBeat.time = currentBuildupStartTime +
        nextBeat.buildup * beatDuration;

      while (nextBeat.time < time && nextBeat.buildup < self.buildupBeats) {
        beat = nextBeat;

        doBeatActions();

        nextBeat = {
          buildup: beat.buildup + 1,
          loop: null,
          loopCount: beat.loopCount
        };
        nextBeat.time = currentBuildupStartTime +
          nextBeat.buildup * beatDuration;
      }
    }

    if (beat.buildup == self.buildupBeats - 1) {
      // Transition from buildup to loop
      beat.buildup = null;
      beat.loop = -1;
    }

    if (beat.loop !== null) {
      var nextBeat = {
        buildup: null,
        loop: beat.loop + 1,
        loopCount: beat.loopCount
      };
      nextBeat.time = currentLoopStartTime +
        nextBeat.loopCount * currentLoopBuffer.duration +
        nextBeat.loop * beatDuration;

      while (nextBeat.time < time) {
        beat = nextBeat;

        doBeatActions();

        if (beat.loop == self.loopBeats - 1) {
          beat.loop = -1;
          beat.loopCount = beat.loopCount + 1;
          console.log("loop count now", beat.loopCount);
        }

        nextBeat = {
          buildup: null,
          loop: beat.loop + 1,
          loopCount: beat.loopCount
        };
        nextBeat.time = currentLoopStartTime +
          nextBeat.loopCount * currentLoopBuffer.duration +
          nextBeat.loop * beatDuration;
      }
    }

    self.callEventListeners("frame", time);
    self["beatAnalysisHandle"] = window.requestAnimationFrame(beatAnalyze);
  }

  var startBeatAnalysis = function() {
    if (self["beatAnalysisHandle"] === null) {
      console.log("Starting beat analysis");
      self["beatAnalysisHandle"] = window.requestAnimationFrame(beatAnalyze);
    }
  };

  var stopBeatAnalysis = function() {
    console.log("Stopping beat analysis");
    var handle = self["beatAnalysisHandle"];
    if (handle !== null) {
      window.cancelAnimationFrame(self["beatAnalysisHandle"]);
      self["beatAnalysisHandle"] = null;
    }
    var beat = { "buildup": null, "loop": null };
    self["beat"] = beat;
    self.callEventListeners("beat", beat);
  };


  window.Hues = Hues;
})();
