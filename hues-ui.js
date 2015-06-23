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

  var setupStatusArea = function(rootElement) {
    var statusDiv = document.createElement("div");
    statusDiv.style.position = "absolute";
    statusDiv.style.left = "0";
    statusDiv.style.right = "0";
    statusDiv.style.bottom = "0";
    rootElement.appendChild(statusDiv);

    setupStatusMode(statusDiv);
    setupStatusCredits(statusDiv);

    var modui = new HuesUIModern(Hues);
    modui.setupUI(rootElement);

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

    /* Ok, not technically a *key* handler, but still. */
    window.addEventListener("wheel", function(e) {
      if (e.defaultPrevented) {
        return;
      }

      if (e.deltaY < 0) {
        Hues.adjustVolume(1.0);
      } else if (e.deltaY > 0) {
        Hues.adjustVolume(-1.0);
      }
    });

    window.addEventListener("keypress", function(e) {
      if (e.defaultPrevented) {
        return;
      }

      /* Firefox returns the character in 'key', chrome the code in 'keyCode'.
       * Because lol javascript */
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
      if (e.defaultPrevented) {
        return;
      }

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
