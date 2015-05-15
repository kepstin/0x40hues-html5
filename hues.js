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

  /* Some cheapo event listening stuff, mostly to hook up UI controls */
  var eventListeners = {
    "automodechange": [],
    "songchange": [],
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

  /*
  var dumpRespack = function(respack) {
    var body = document.body;
    var header = document.createElement("h1");
    var link = document.createElement("a");
    link.href = respack["link"];
    link.textContent = respack["name"];
    header.appendChild(link);
    body.appendChild(header);
    var desc = document.createElement("p");
    desc.textContent = respack["description"];
    body.appendChild(desc);
    var desc = document.createElement("p");
    desc.textContent = "-" + respack["author"];
    body.appendChild(desc);

    var stopButton = document.createElement("button");
    stopButton.textContent = "Stop";
    stopButton.addEventListener("click", function() {
      Hues.stopSong();
    });
    body.appendChild(stopButton);

    var playButton = document.createElement("button");
    playButton.textContent = "Play";
    playButton.addEventListener("click", function() {
      Hues.playSong()
      .then(updateSongInfo);
    });
    body.appendChild(playButton);

    var prevButton = document.createElement("button");
    prevButton.textContent = "Previous";
    prevButton.addEventListener("click", function() {
      Hues.prevSong()
      .then(updateSongInfo);
    });
    body.appendChild(prevButton);

    var nextButton = document.createElement("button");
    nextButton.textContent = "Next";
    nextButton.addEventListener("click", function() {
      Hues.nextSong()
      .then(updateSongInfo);
    });
    body.appendChild(nextButton);

    var songHeader = document.createElement("h2");
    songHeader.textContent = "Now Playing";
    body.appendChild(songHeader);
    var songInfo = document.createElement("div");
    songInfo.id = "songInfo";
    body.appendChild(songInfo);

    var clearSongInfo = function() {
      while (songInfo.firstChild) {
        songInfo.removeChild(songInfo.firstChild);
      }
    }
    var updateSongInfo = function(song) {
      clearSongInfo();

      var songHeader = document.createElement("p");
      var songLink = document.createElement("a");
      songLink.href = song["source"];
      songLink.textContent = song["title"];
      songHeader.appendChild(songLink);
      songInfo.appendChild(songHeader);

      if (song["buildup"]) {
        if (song["buildupRhythm"]) {
          var buildupRhythm = document.createElement("pre");
          buildupRhythm.textContent = song["buildupRhythm"];
          songInfo.appendChild(buildupRhythm);
        } else {
          var buildupRhythm = document.createElement("p");
          buildupRhythm.textContent = "This song has a buildup, but no buildup rhythm.";
          songInfo.appendChild(buildupRhythm);
        }
      }

      var rhythm = document.createElement("pre");
      rhythm.textContent = song["rhythm"];
      songInfo.appendChild(rhythm);
    };

    var currentSong = Hues.getCurrentSong();
    if (currentSong) {
      updateSongInfo(currentSong);
    }

    var imagesHeader = document.createElement("h2");
    imagesHeader.textContent = "Images";
    body.appendChild(imagesHeader);
    var imagesNote = document.createElement("p");
    imagesNote.textContent = "Images are temporarily disabled, but should be returning soonish, I promise...";
    body.appendChild(imagesNote);
    respack["images"].forEach(function(image) {
      var imageHeader = document.createElement("h3");
      var imageLink = document.createElement("a");
      imageLink.href = image["source"];
      imageLink.textContent = image["name"];
      imageHeader.appendChild(imageLink);
      body.appendChild(imageHeader);

      var imageFullname = document.createElement("p");
      imageFullname.textContent = image["fullname"];
      body.appendChild(imageFullname);

      var imageContainer = document.createElement("div");
      imageContainer.style.textAlign = image["align"];
      if (image["image"]) {
        var img = document.createElement("img");
        img.src = URL.createObjectURL(image["image"]);
        img.style.maxHeight = "360px";
        imageContainer.appendChild(img);
      } else {
        var img = document.createElement("img");
        img.style.maxHeight = "360px";
        imageContainer.appendChild(img);
        dumpRespackAnimation(img, image);
      }
      body.appendChild(imageContainer);
    });
  }
  */

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
