/* Approximation of Retro UI */
(function() {
  "use strict";
  var selector = window.huesConfig["uiSelector"];
  var autoPlay = window.huesConfig["autoPlay"];
  if (typeof(selector) === 'undefined') {
    selector = 'body';
  }
  if (typeof(autoPlay) === 'undefined') {
    autoPlay = false;
  }

  var HuesUI = {};

  var setupRootElement = function() {
    var rootElement = document.querySelector(selector);
    if (!rootElement) {
      return Promise.reject(Error("Cannot find requested root element " +
            rootElement + " on page."));
    }
    /*while (rootElement.firstChild) {
      rootElement.removeChild(rootElement.firstChild);
    }*/
    return Promise.resolve(rootElement);
  }

  var setupStatusMode = function(statusDiv) {
    var modeDiv = document.createElement("div");
    statusDiv.appendChild(modeDiv);
    var modeLabel = document.createElement("span");
    modeLabel.textContent = "M=";
    modeDiv.appendChild(modeLabel);
    var modeField = document.createElement("span");
    modeField.textContent = "undefined";
    modeDiv.appendChild(modeField);

    var updateModeField = function(autoMode) {
      modeField.textContent = autoMode.toUpperCase();
    };
    updateModeField(Hues.getAutoMode());
    Hues.addEventListener("automodechange", updateModeField);
  }

  var setupStatusImage = function(statusDiv) {
    var imageDiv = document.createElement("div");
    statusDiv.appendChild(imageDiv);
    var imageLabel = document.createElement("span");
    imageLabel.textContent = "I=";
    imageDiv.appendChild(imageLabel);
    var imageField = document.createElement("span");
    imageField.textContent = "undefined";
    imageDiv.appendChild(imageField);

    var updateImageField = function(imageInfo) {
      imageField.textContent = imageInfo["name"].toUpperCase();
    }
    updateImageField(Hues.getCurrentImage());
    Hues.addEventListener("imagechange", updateImageField);
  };

  var setupStatusBeatNum = function(statusDiv) {
    var beatDiv = document.createElement("div");
    statusDiv.appendChild(beatDiv);
    var beatLabel = document.createElement("span");
    beatLabel.textContent = "B=$0x";
    beatDiv.appendChild(beatLabel);
    var beatField = document.createElement("span");
    beatField.textContent = "0000";
    beatDiv.appendChild(beatField);

    var updateBeatField = function(beat) {
      var beatNum = "0";
      if (beat["buildup"] !== null) {
        beatNum = beat["buildup"].toString(16);
      } else if (beat["loop"] !== null) {
        beatNum = beat["loop"].toString(16);
      }
      var padding = 4 - beatNum.length;
      if (padding > 0) {
        beatNum = "0".repeat(padding) + beatNum;
      }
      if (beat["buildup"] !== null) {
        beatNum += " (BUILD)";
      }
      beatField.textContent = beatNum.toUpperCase();
    };
    Hues.addEventListener("beat", updateBeatField);
  };

  var setupStatusVolume = function(statusDiv) {
    var volumeDiv = document.createElement("div");
    statusDiv.appendChild(volumeDiv);
    var volumeLabel = document.createElement("span");
    volumeLabel.textContent = "V=";
    volumeDiv.appendChild(volumeLabel);
    var volumeField = document.createElement("span");
    volumeField.textContent = "0.0dB";
    volumeDiv.appendChild(volumeField);

    var updateVolumeField = function(muted, gain) {
      if (muted) {
        volumeField.textContent = "MUTED";
      } else {
        volumeField.textContent = gain.toFixed(1) + "dB";
      }
    };
    Hues.addEventListener("volumechange", updateVolumeField);
    updateVolumeField(Hues.isMuted(), Hues.getVolume());
  };

  var setupStatusHue = function(statusDiv) {
    var hueDiv = document.createElement("div");
    statusDiv.appendChild(hueDiv);
    var hueLabel = document.createElement("span");
    hueLabel.textContent = "C=$0x";
    hueDiv.appendChild(hueLabel);
    var hueField = document.createElement("span");
    hueDiv.appendChild(hueField);

    var updateHueField = function(hueInfo) {
      var hueNum = hueInfo["index"].toString(16);
      if (hueNum.length < 2) {
        hueNum = "0" + hueNum;
      }
      hueField.textContent = hueNum.toUpperCase();
    };
    updateHueField(Hues.getCurrentHue());
    Hues.addEventListener("huechange", updateHueField);
  };

  var setupStatusHueName = function(statusDiv) {
    var hueField = document.createElement("div");
    statusDiv.appendChild(hueField);

    var updateHueField = function(hueInfo) {
      hueField.textContent = hueInfo["hue"]["name"].toUpperCase();
    }
    updateHueField(Hues.getCurrentHue());
    Hues.addEventListener("huechange", updateHueField);
  };

  var setupStatusSong = function(statusDiv) {
    var songField = document.createElement("div");
    statusDiv.appendChild(songField);

    var updateSongField = function(song) {
      if (song) {
        songField.textContent = song["title"].toUpperCase();
      } else {
        songField.textContent = "[UNDEFINED]";
      }
    }
    updateSongField(Hues.getCurrentSong());
    Hues.addEventListener("songchange", updateSongField);
  }

  var setupStatusCredits = function(statusDiv) {
    var creditsDiv = document.createElement("div");
    creditsDiv.style.opacity = "0.50";
    statusDiv.appendChild(creditsDiv);
    var creditsLink = document.createElement("a");
    creditsLink.href = "https://github.com/kepstin/0x40hues-html5";
    creditsLink.textContent = "0x40 HUES OF HTML5 BY KEPSTIN";
    creditsLink.target = "_blank";
    creditsDiv.appendChild(creditsLink);
  }

  var setupStatusBeats = function(statusDiv) {
    var beatsDiv = document.createElement("div");
    beatsDiv.style.overflowX = "hidden";
    beatsDiv.style.whiteSpace = "nowrap";
    statusDiv.appendChild(beatsDiv);
    var beatsLabel = document.createElement("span");
    beatsLabel.textContent = ">>";
    beatsDiv.appendChild(beatsLabel);
    var beatsField = document.createElement("span");
    beatsDiv.appendChild(beatsField);

    var updateBeats = function(beat) {
      var beats = Hues.getBeatString();
      beatsField.textContent = beats;
    }
    Hues.addEventListener("beat", updateBeats);
  }

  var setupStatusArea = function(rootElement) {
    var statusDiv = document.createElement("div");
    statusDiv.style.position = "absolute";
    statusDiv.style.left = "0";
    statusDiv.style.right = "0";
    statusDiv.style.bottom = "0";
    rootElement.appendChild(statusDiv);

    setupStatusMode(statusDiv);
    setupStatusImage(statusDiv);
    setupStatusVolume(statusDiv);
    setupStatusBeatNum(statusDiv);
    setupStatusHue(statusDiv);
    setupStatusHueName(statusDiv);
    setupStatusSong(statusDiv);
    setupStatusCredits(statusDiv);
    setupStatusBeats(statusDiv);

    return Promise.resolve(rootElement);
  }

  var setupProgress = function(rootElement) {
    return new Promise(function(resolve, reject) {
      var progressContainer = document.createElement("div");
      progressContainer.style.position = "absolute";
      progressContainer.style.display = "block";
      progressContainer.style.background = "white";
      progressContainer.style.top = "0";
      progressContainer.style.left = "0";
      progressContainer.style.right = "0";
      progressContainer.style.bottom = "0";
      progressContainer.style.width = "100%";
      progressContainer.style.height = "100%";
      rootElement.appendChild(progressContainer);

      var progressDiv = document.createElement("div");
      progressDiv.style.position = "relative";
      progressDiv.style.top = "50%";
      progressDiv.style.transform = "translateY(-50%);"
      progressDiv.style.textAlign = "center";
      progressDiv.style.fontSize = "600%";
      progressContainer.appendChild(progressDiv);

      var completed = 0;
      var total = 0;
      var updateProgress = function() {
        var progress;
        if (total == 0) {
          progress = 0;
        } else {
          progress = completed / total;
        }
        progress = Math.floor(progress * 64);

        var progressStr = progress.toString(16);
        var padding = 2 - progressStr.length;
        if (padding > 0) {
          progressStr = "0".repeat(padding) + progressStr;
        }
        progressDiv.textContent = "0x" + progressStr;
      };
      Hues.addEventListener("progressstart", function() {
        completed = 0;
        total = 0;
        progressContainer.style.display = "block";
        updateProgress();
      });
      Hues.addEventListener("progress", function(done, added) {
        completed += done;
        total += added;
        updateProgress();
      });
      Hues.addEventListener("progressend", function() {
        setTimeout(function() {
          progressContainer.style.display = "none";
          resolve(rootElement);
        }, 500);
      });
    });
  }

  var setupEffectCanvas = function(rootElement) {
    var canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.display = "block";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.right = "0";
    canvas.style.bottom = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.width = rootElement.clientWidth;
    canvas.height = rootElement.clientHeight;
    rootElement.appendChild(canvas);

    return window.HuesEffect.setup(window.Hues, canvas)
      .then(function() { return rootElement; });
  }

  var setupKeyHandlers = function(rootElement) {
    /* Even though we have the root element, keys are going to be installed
     * on the window. */

    window.addEventListener("keypress", function(e) {
      /* Firefox returns the character in 'key', chrome the code in 'keyCode'.
       * Because lol javascript */
      if (event.defaultPrevented) {
        return;
      }

      var key = e.key;
      if (!key) {
        switch (e.keyCode) {
        case 43: key = '+'; break;
        case 45: key = '-'; break;
        case 61: key = '='; break;
        case 102: key = 'f'; break;
        case 109: key = 'm'; break;
        }
      }
      switch (key) {
      case '+':
      case '=':
        Hues.adjustVolume(1.0);
        break;
      case '-':
        Hues.adjustVolume(-1.0);
        break;
      case 'f':
        if (Hues.getAutoMode() == "normal") {
          Hues.setAutoMode("full auto");
        } else {
          Hues.setAutoMode("normal");
        }
        break;
      case 'm':
        if (Hues.isMuted()) {
          Hues.unmute();
        } else {
          Hues.mute();
        }
        break;
      }
    });
    /* Arrow keys don't have "press" events */
    window.addEventListener("keyup", function(e) {
      var key = e.key;
      if (!key) {
        switch (e.keyCode) {
        case 16: key = 'Shift'; break;
        case 37: key = 'ArrowLeft'; break;
        case 38: key = 'ArrowUp'; break;
        case 39: key = 'ArrowRight'; break;
        case 40: key = 'ArrowDown'; break;
        }
      }
      switch (key) {
      case 'Shift':
        Hues.randomSong();
        break;
      case 'ArrowDown':
      case 'Down':
        console.log("Down Arrow - Previous Song");
        Hues.prevSong();
        break;
      case 'ArrowUp':
      case 'Up':
        Hues.nextSong();
        break;
      case 'ArrowLeft':
      case 'Left':
        Hues.setAutoMode("normal");
        Hues.prevImage();
        break;
      case 'ArrowRight':
      case 'Right':
        Hues.setAutoMode("normal");
        Hues.nextImage();
        break;
      }
    });
  }
  
  var initialize = function() {
    var rootElement = setupRootElement()
    .then(setupEffectCanvas);
    var progress = rootElement.then(setupProgress);
    var respack = rootElement.then(Hues.loadDefaultRespack);

    return Promise.all([rootElement, progress, respack])
    .then(function(args) { return args[0]; })
    .then(setupStatusArea)
    .then(setupKeyHandlers)
    .then(function() {
      if (autoPlay) { return Hues.playSong(); }
    }).catch(function(error) {
      console.log(error);
    });
  }
  HuesUI["initialize"] = initialize;

  window.HuesUI = HuesUI;
})();

if (document.readyState == "complete") {
  HuesUI.initialize();
} else {
  document.addEventListener("readystatechange", function() {
    if (document.readyState == "complete") {
      HuesUI.initialize();
    }
  });
}
