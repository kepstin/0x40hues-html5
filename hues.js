(function() {
  var defaultRespackURI = window.huesConfig["respack"];
  var defaultSong = window.huesConfig["defaultSong"];
  var autoMode = window.huesConfig["autoMode"];

  if (typeof(defaultRespackURI) === 'undefined') {
    defaultRespackURI = encodeURIComponent("0x40 Hues 5.0 Defaults");
  }
  if (typeof(defaultSong) === 'undefined') {
    defaultSong = 18;
  }
  if (autoMode != "normal" && autoMode != "full auto") {
    autoMode = "full auto";
  }

  var Hues = {};

  /* TODO: get the official hues list(s).
   * This is currently using the list from miniHues, which doesn't match the
   * flash. */
  var hues = [
    {name:"Mahogany",			value:"#CD4A4A"}, {name:"Banana Mania",			value:"#FAE7B5"},
    {name:"Beaver",			value:"#9F8170"}, {name:"Black",				value:"#232323"},
    {name:"Chestnut",			value:"#BC5D58"}, {name:"Copper",				value:"#DD9475"},
    {name:"Cornflower",		value:"#9ACEEB"}, {name:"Denim",				value:"#2B6CC4"},
    {name:"Desert Sand",		value:"#EFCDB8"}, {name:"Eggplant",				value:"#6E5160"},
    {name:"Electric Lime",	value:"#1DF914"}, {name:"Fern",					value:"#71BC78"},
    {name:"Goldenrod",		value:"#FCD975"}, {name:"Granny Smith Apple",	value:"#A8E4A0"},
    {name:"Gray",				value:"#95918C"}, {name:"Green",				value:"#1CAC78"},
    {name:"Hot Magenta",		value:"#FF1DCE"}, {name:"Inch Worm",			value:"#B2EC5D"},
    {name:"Indigo",			value:"#5D76CB"}, {name:"Laser Lemon",			value:"#FDFC74"},
    {name:"Lavender",			value:"#FCB4D5"}, {name:"Macaroni and Cheese",	value:"#FFBD88"},
    {name:"Manatee",			value:"#979AAA"}, {name:"Mango Tango",			value:"#FF8243"},
    {name:"Melon",			value:"#FDBCB4"}, {name:"Midnight Blue",		value:"#1A4876"},
    {name:"Neon Carrot",		value:"#FFA343"}, {name:"Olive Green",			value:"#BAB86C"},
    {name:"Orange",			value:"#FF7538"}, {name:"Orchid",				value:"#E6A8D7"},
    {name:"Outer Space",		value:"#414A4C"}, {name:"Outrageous Orange",	value:"#FF6E4A"},
    {name:"Pacific Blue",		value:"#1CA9C9"}, {name:"Periwinkle",			value:"#C5D0E6"},
    {name:"Plum",				value:"#8E4585"}, {name:"Purple Heart",			value:"#7442C8"},
    {name:"Raw Sienna",		value:"#D68A59"}, {name:"Razzmatazz",			value:"#E3256B"},
    {name:"Red",				value:"#EE204D"}, {name:"Robin Egg Blue",		value:"#1FCECB"},
    {name:"Royal Purple",		value:"#7851A9"}, {name:"Salmon",				value:"#FF9BAA"},
    {name:"Scarlet",			value:"#FC2847"}, {name:"Sea Green",			value:"#9FE2BF"},
    {name:"Sepia",			value:"#A5694F"}, {name:"Shadow",				value:"#8A795D"},
    {name:"Shamrock",			value:"#45CEA2"}, {name:"Shocking Pink",		value:"#FB7EFD"},
    {name:"Spring Green",		value:"#ECEABE"}, {name:"Sunset Orange",		value:"#FD5E53"},
    {name:"Tan",				value:"#FAA76C"}, {name:"Tickle Me Pink",		value:"#FC89AC"},
    {name:"Timberwolf",		value:"#DBD7D2"}, {name:"Tropical Rain Forest",	value:"#17806D"},
    {name:"Turquoise Blue",	value:"#77DDE7"}, {name:"Vivid Tangerine",		value:"#FFA089"},
    {name:"Vivid Violet",		value:"#8F509D"}, {name:"White",				value:"#EDEDED"},
    {name:"Wild Strawberry",	value:"#FF43A4"}, {name:"Wild Watermelon",		value:"#FC6C85"},
    {name:"Wisteria",			value:"#CDA4DE"}, {name:"Yellow",				value:"#FCE883"},
    {name:"Yellow Green",		value:"#C5E384"}, {name:"Yellow Orange",		value:"#FFB653"}
  ];

    /* Some cheapo event listening stuff, mostly to hook up UI controls */
  var eventListeners = {
    "automodechange": [],
    "songchange": [],
    "huechange": [],
    "beat": [],
  };
  var addEventListener = function(ev, callback) {
    ev = ev.toLowerCase();
    if (typeof(eventListeners[ev]) !== "undefined") {
      eventListeners[ev].push(callback);
    } else {
      throw Error("Unknown event: " + ev);
    }
  };
  Hues["addEventListener"] = addEventListener;
  var removeEventListener = function(ev, callback) {
    ev = ev.toLowerCase();
    if (typeof(eventListeners[ev]) !== "undefined") {
      eventListeners[ev] = eventListeners[ev].filter(function(a) {
        return (a !== callback);
      });
    } else {
      throw Error("Unknown event: " + ev);
    }
  };
  Hues["removeEventListener"] = removeEventListener;
  var callEventListeners = function(ev) {
    var args = Array.prototype.slice.call(arguments, 1);
    eventListeners[ev].forEach(function(callback) {
      callback.apply(null, args);
    });
  };

  /* Set/get automatic mode (auto picture switching) */
  var getAutoMode = function() {
    return autoMode;
  };
  Hues["getAutoMode"] = getAutoMode;
  var setAutoMode = function(newAutoMode) {
    autoMode = newAutoMode;
    callEventListeners("automodechange", autoMode);
  };

  var audioCtx = new AudioContext;
  var currentSongNum = defaultSong;
  var currentSong = null;
  var currentBuildupSource = null;
  var currentBuildupBuffer = null;
  var currentBuildupStartTime = null;
  var currentLoopSource = null;
  var currentLoopBuffer = null;
  var currentLoopStartTime = null;
  var currentBeatDuration = null;
  var currentHue = {name: "White", value: "#EDEDED"};
  var currentBeat = {buildup: null, loop: null};

  var gainNode = audioCtx.createGain();

  Hues["respack"] = {};

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

  var loadRespackSongTrackFetch = function(uri) {
    return new Promise(function(resolve, reject) {
      console.log("attempting to fetch " + uri);
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
      console.log("Loading track with baseuri " + uri);
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
          console.log("Respack contains no songs");
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

            respack["songs"].push(song);

            node = iterator.iterateNext();
          };

          resolve(respack);
        });
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
      fetch(respack["uri"] + "/Animations/" + name + "/" + name + "_" +
          number + ".png")
      .catch(reject)
      .then(function(response) {

        if (response.status == 404) {
          // The previous image was the last in the series
          console.log("If you got a 404 error there it was expected and " +
                "unavoidable... You can just ignore it.");
          resolve(image);
          return;
        }

        if (!response.ok) {
          reject(Error("Failed to fetch frame " + i + " of image " +
                image["name"] + " in " + respack["name"] + ": " +
                response.status + " " + response.statusText));
          return;
        }
        
        response.blob()
        .catch(reject)
        .then(function(blob) {
          image["animation"].push(blob);
          resolve(loadRespackImageAnimationFrame(respack, image, i + 1));
        });

      });
    });
  }

  var loadRespackImageAnimation = function(respack, image) {
    return new Promise(function(resolve, reject) {
      // Animations are a bit tricky, since the xml file doesn't say how many
      // frames there are. We have to fetch them until we hit a missing file...
      image["animation"] = [];
      var i = 1;

      loadRespackImageAnimationFrame(respack, image, i)
      .catch(reject)
      .then(function() {
        if (image["animation"].length == 0) {
          reject(Error("Animation for image " + image["name"] + " in " +
                respack["name"] + " had no frames load"));
        } else {
          resolve(image);
        }
      });
    });
  }

  var loadRespackImageSingle = function(respack, image) {
    return new Promise(function(resolve, reject) {
      fetch(respack["uri"] + "/Images/" + encodeURIComponent(image["name"]) +
          ".png")
      .catch(reject)
      .then(function(response) {
        if (!response.ok) {
          reject(Error("Failed to fetch image " + image["name"] + " in " +
                respack["name"] + ": " + response.status + " " +
                response.statusText));
          return;
        }

        response.blob()
        .catch(reject)
        .then(function(blob) {
          image["image"] = blob;
          resolve(image);
        });
      });
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
          // Respack has no images, that's OK here.
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
            imagePromises.push(loadRespackImageMedia(respack, image));

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
      var respack = {
        "uri": uri
      };

      var respackInfo = loadRespackInfo(respack);
      
      respackInfo.then(function(respack) {
        console.log("Loaded respack info for " + respack["name"]);
      });

      var respackSongs = respackInfo.then(loadRespackSongs);
      respackSongs.then(function(respack) {
        console.log("Loaded " + respack["songs"].length +
            " songs from " + respack["name"]);
      });

      var respackImages = respackInfo.then(loadRespackImages);
      respackImages.then(function(respack) {
        console.log("Loaded " + respack["images"].length +
            " images from " + respack["name"]);
      });
      Promise.all([respackSongs, respackImages])
      .catch(reject)
      .then(function() {
        Hues["respack"] = respack;
        resolve(respack);
      });

    });
  }
  Hues["loadRespack"] = loadRespack;

  var loadDefaultRespack = function() {
    return loadRespack(defaultRespackURI).then(function(respack) {
      if (respack["songs"]) {
        currentSong = respack[defaultSong];
      }
    });
  }
  Hues["loadDefaultRespack"] = loadDefaultRespack;

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

    currentSong = null;
  }
  Hues["stopSong"] = stopSong;

  var changeSong = function(respack, song) {
    stopSong();

    console.log("Switching to " + song["title"]);

    var newSong = loadRespackSongMedia(respack, song)
    .then(function() {
      currentSong = song;

      var buildupBuffer = song["buildupBuffer"];
      var buildupDuration = 0;
      var buildupSource = null;
      if (buildupBuffer && buildupBuffer.length > 0) {
        buildupDuration = buildupBuffer.duration;
        buildupSource = audioCtx.createBufferSource();
        buildupSource.buffer = buildupBuffer;
        buildupSource.connect(audioCtx.destination);
      }

      var loopBuffer = song["loopBuffer"];
      var loopDuration = loopBuffer.duration;
      var loopSource = audioCtx.createBufferSource();
      loopSource.buffer = loopBuffer;
      loopSource.loop = true;
      loopSource.connect(audioCtx.destination);

      var beatDuration = loopDuration / song["rhythm"].length;
      console.log("Beat duration is " + beatDuration);
      console.log("Buildup duration is " + buildupDuration + " (" +
        Math.round(buildupDuration / beatDuration) + " beats)")
      console.log("Loop duration is " + loopDuration + " (" +
        song["rhythm"].length + " beats)")
      currentBeatDuration = beatDuration;

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

      var buildupStart = audioCtx.currentTime;
      var loopStart = buildupStart + buildupDuration;

      if (buildupSource) {
        currentBuildupSource = buildupSource;
        currentBuildupBuffer = buildupBuffer;
        buildupSource.start(buildupStart);
      }
      currentLoopSource = loopSource;
      currentLoopBuffer = loopBuffer;
      loopSource.start(loopStart);

      currentBuildupStartTime = buildupStart;
      currentLoopStartTime = loopStart;

      return song;
    });

    newSong.then(function(song) {
      callEventListeners("songchange", song);
    });

    return newSong;
  };
  Hues["changeSong"] = changeSong;

  var playSong = function() {
    var respack = Hues["respack"];
    return changeSong(respack, respack["songs"][currentSongNum]);
  }
  Hues["playSong"] = playSong;

  var prevSong = function() {
    var respack = Hues["respack"];
    currentSongNum -= 1;
    if (currentSongNum < 0) {
      currentSongNum = respack["songs"].length - 1;
    }
    return changeSong(respack, respack["songs"][currentSongNum]);
  }
  Hues["prevSong"] = prevSong;

  var nextSong = function() {
    var respack = Hues["respack"];
    currentSongNum += 1;
    if (currentSongNum >= respack["songs"].length) {
      currentSongNum = 0;
    }
    return changeSong(respack, respack["songs"][currentSongNum]);
  }
  Hues["nextSong"] = nextSong;

  var getCurrentSong = function() {
    return currentSong;
  }
  Hues["getCurrentSong"] = getCurrentSong;

  var getCurrentHue = function() {
    return currentHue;
  };
  Hues["getCurrentHue"] = getCurrentHue;

  var randomHue = function() {
    currentHue = hues[Math.floor(Math.random() * hues.length)];
    return currentHue;
  }
  randomHue();

  var getBeatString = function() {
    if (!currentLoopBuffer) {
      return null;
    }

    var beats = "";
    var length = arguments[0];
    if (typeof(length) === "undefined") {
      length = 256;
    }

    var time = audioCtx.currentTime;
    if (typeof(currentSong["buildupRhythm"]) !== "undefined" &&
        time < currentLoopStartTime) {
      /* In the buildup */
      var beat = Math.floor((time - currentBuildupStartTime) /
          currentBeatDuration);
      beats += currentSong["buildupRhythm"].slice(beat);
    } else if (time >= currentLoopStartTime) {
      var beat = Math.floor(
          (time - currentLoopStartTime) % currentLoopBuffer.duration /
              currentBeatDuration);
      beats += currentSong["rhythm"].slice(beat);
    }

    while (beats.length < 256) {
      beats += currentSong["rhythm"];
    }

    return beats;
  };
  Hues["getBeatString"] = getBeatString;

  window.Hues = Hues;
})();
