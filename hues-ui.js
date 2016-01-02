/* 0x40 Hues of HTML5
 * UI Framework and Loading screen
 *
 * Copyright (c) 2015 Calvin Walton <calvin.walton@kepstin.ca>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
window.HuesUI = (function() {
  "use strict";
  var Self = (function() {
    var Self = function() {
      this.root = null

      this.error = null

      this.progressContainer = null
      this.progress = null
      this.progressCompleted = 0
      this.progressTotal = 0

      this.canvas = null

      Object.seal(this)
    }

    Self.prototype.setupError = function() {
      var error = this.root.ownerDocument.createElement("div")
      error.className = "hues-error"
      this.root.appendChild(error)
      this.error = error
    }

    Self.prototype.renderError = function(error) {
      console.log(error)
      this.error.className = "hues-error-visible"
      this.error.textContent = error
    }

    Self.prototype.updateProgress = function() {
      var progress = 0
      if (this.progressTotal > 0) {
        progress = this.progressCompleted / this.progressTotal
      }

      progress = Math.floor(progress * 0x40)

      var progressStr = progress.toString(16)
      var padding = 2 - progressStr.length
      if (padding > 0) {
        progressStr = "0".repeat(padding) + progressStr
      }
      this.progress.textContent = "0x" + progressStr
    }

    Self.prototype.handleProgressStart = function() {
      this.progressCompleted = 0
      this.progressTotal = 0
      this.progressContainer.className = "hues-progress-container-visible"

      this.updateProgress()
    }

    Self.prototype.handleProgress = function(done, added) {
      this.progressCompleted += done;
      this.progressTotal += added;

      this.updateProgress()
    }

    Self.prototype.fadeoutProgress = function() {
      var self = this;
      return new Promise(function(resolve, reject) {
        self.progressContainer.className = "hues-progress-container"
        window.setTimeout(function() {
          self.progressContainer.className = "hues-progress-container-hidden"
          resolve()
        }, 500)
      })
    }

    Self.prototype.setupProgress = function() {
      var progressContainer = this.root.ownerDocument.createElement("div")
      progressContainer.className = "hues-progress-container"
      this.root.appendChild(progressContainer)
      this.progressContainer = progressContainer

      var progress = this.root.ownerDocument.createElement("div")
      progress.className = "hues-progress"
      progressContainer.appendChild(progress)
      this.progress = progress

      Hues.addEventListener("progressstart",
          this.handleProgressStart.bind(this))
      Hues.addEventListener("progress", this.handleProgress.bind(this))

      return Promise.resolve()
    }

    Self.prototype.setupEffectCanvas = function(options) {
      var canvas = this.root.ownerDocument.createElement("canvas")
      canvas.className = "hues-canvas"
      this.root.appendChild(canvas)
      this.canvas = canvas

      return window.HuesEffect.setup(window.Hues, canvas, options)
    }

    Self.prototype.setupEffectHandlers = function() {
      Hues.addEventListener("inverteffect", (function(beatTime, inverted) {
        if (inverted) {
          this.root.classList.add("inverted");
        } else {
          this.root.classList.remove("inverted");
        }
      }).bind(this));
    }

    Self.prototype.setupKeyHandlers = function() {
      /* Ok, not technically a *key* handler, but still. */
      this.root.addEventListener("wheel", function(e) {
        if (e.defaultPrevented) {
          return
        }

        if (e.deltaY < 0) {
          Hues.adjustVolume(1.0)
        } else if (e.deltaY > 0) {
          Hues.adjustVolume(-1.0)
        }
        e.preventDefault()
      })

      /* Normal keys that return 'press' events after a full press+release */
      this.root.addEventListener("keypress", function(e) {
        if (e.defaultPrevented) {
          return
        }

        /* Firefox returns the character in 'key', chrome the code in 'keyCode'.
         * Because lol javascript */
        var key = e.key
        if (!key) {
          switch (e.keyCode) {
          case 43: key = '+'; break
          case 45: key = '-'; break
          case 61: key = '='; break
          case 102: key = 'f'; break
          case 109: key = 'm'; break
          }
        }
        switch (key) {
        case '+':
        case '=':
          Hues.adjustVolume(1.0)
          e.preventDefault()
          break
        case '-':
          Hues.adjustVolume(-1.0)
          e.preventDefault()
          break
        case 'f':
          if (Hues.getAutoMode() == "normal") {
            Hues.setAutoMode("full auto")
          } else {
            Hues.setAutoMode("normal")
          }
          e.preventDefault()
          break
        case 'm':
          if (Hues.isMuted()) {
            Hues.unmute()
          } else {
            Hues.mute()
          }
          e.preventDefault()
          break
        }
      })

      /* Arrow keys and modifiers don't get "press" events */
      window.addEventListener("keyup", function(e) {
        if (e.defaultPrevented) {
          return;
        }

        var key = e.key;
        if (!key) {
          switch (e.keyCode) {
          case 16: key = 'Shift'; break
          case 37: key = 'ArrowLeft'; break
          case 38: key = 'ArrowUp'; break
          case 39: key = 'ArrowRight'; break
          case 40: key = 'ArrowDown'; break
          }
        }
        switch (key) {
        case 'Shift':
          Hues.randomSong()
          e.preventDefault()
          break
        case 'ArrowDown':
        case 'Down':
          Hues.prevSong()
          e.preventDefault()
          break
        case 'ArrowUp':
        case 'Up':
          Hues.nextSong()
          e.preventDefault()
          break
        case 'ArrowLeft':
        case 'Left':
          Hues.setAutoMode("normal")
          Hues.prevImage()
          e.preventDefault()
          break
        case 'ArrowRight':
        case 'Right':
          Hues.setAutoMode("normal")
          Hues.nextImage()
          e.preventDefault()
          break
        }
      })

      return Promise.resolve()
    }

    Self.prototype.initialize = function(options) {
      if (typeof(options) === 'undefined') {
        options = window.huesConfig
      }
      var selector = options.selector
      if (typeof(selector) === 'undefined') {
        selector = 'body';
      }

      this.root = document.querySelector(selector)
      if (!this.root) {
        throw new Error("Cannot find requested root element " + selector)
      }
      this.root.classList.add("hues-root");

      this.setupError()

      /* From this point on, all work is done with promises, and errors
       * are user-visible */
      var progress = this.setupProgress()

      var respack = progress.then(function() {
        return Hues.initialize(options)
      })
      var canvas = progress.then(function () {
        this.setupEffectCanvas(options)
      }.bind(this))

      var modernUI = new HuesUIModern(Hues)

      Promise.all([respack, canvas])
      .then(function() { modernUI.setupUI(this.root) }.bind(this))
      .then(function() { window.HuesEffect.renderFrame(); })
      .then(this.setupEffectHandlers.bind(this))
      .then(this.setupKeyHandlers.bind(this))
      .then(this.fadeoutProgress.bind(this))
      .then(function() { if (options.autoPlay) { return Hues.playSong() } })
      .catch(this.renderError.bind(this))
    }

    return Self
  })()

  return function() {
    var self = new Self()
    this.initialize = function(options) {
      self.initialize(options)
    }
    Object.seal(this)
  }
})()

if (document.readyState == "complete") {
  var huesUI = new HuesUI();
  huesUI.initialize();
} else {
  document.addEventListener("readystatechange", function() {
    if (document.readyState == "complete") {
      var huesUI = new HuesUI();
      huesUI.initialize();
    }
  });
}
