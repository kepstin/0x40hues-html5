window.HuesUIModern = (function() {
  "use strict";
  var Self = (function() {
    var Self = function(hues) {
      this.hues = hues;
    }

    Self.prototype.hues = null

    Self.prototype.root = null

    Self.prototype.beatBar = null
    Self.prototype.beatLeft = null
    Self.prototype.beatRight = null
    Self.prototype.beatCenter = null

    Self.prototype.controls = null

    Self.prototype.imageName = null
    Self.prototype.imageNameLink = null
    Self.prototype.imageNameText = null

    Self.prototype.songTitle = null
    Self.prototype.songTitleLink = null
    Self.prototype.songTitleText = null

    Self.prototype.queuedResizeSongTitle = null

    Self.prototype.updateBeatBar = function(beat) {
      var beats = this.hues.getBeatString()

      var current = beats[0]
      var rest = beats.slice(1)

      this.beatLeft.textContent = rest;
      this.beatRight.textContent = rest;


      if (current != ".") {
        while (this.beatCenter.firstElementChild) {
          this.beatCenter.removeChild(this.beatCenter.firstElementChild);
        }
        var span = this.beatCenter.ownerDocument.createElement("span")
        span.textContent = current;
        this.beatCenter.appendChild(span);
      }
    }

    Self.prototype.resizeImageName = function() {
      var link = this.imageNameLink
      var text = this.imageNameText

      link.className = ""
      if (text.offsetWidth > link.clientWidth) {
        link.className = "small"
      }
      if (text.offsetWidth > link.clientWidth) {
        link.className = "x-small"
      }
    }

    Self.prototype.updateImageName = function(image) {
      var name = this.imageName

      while (name.firstElementChild) {
        name.removeChild(name.firstElementChild);
      }

      var link = name.ownerDocument.createElement("a")
      link.href = image.source
      link.target = "_blank"
      name.appendChild(link)
      this.imageNameLink = link

      var text = name.ownerDocument.createElement("span")
      text.textContent = image.fullname.toUpperCase()
      link.appendChild(text)
      this.imageNameText = text

      this.resizeImageName()
    }

    Self.prototype.updateSongTitle = function(song) {
      var title = this.songTitle

      while (title.firstElementChild) {
        title.removeChild(title.firstElementChild);
      }

      var link = title.ownerDocument.createElement("a")
      link.href = song.source
      link.target = "_blank"
      title.appendChild(link)
      this.songTitleLink = link

      var text = title.ownerDocument.createElement("span")
      text.textContent = song.title.toUpperCase()
      link.appendChild(text)
      this.songTitleText = text

      this.resizeSongTitle()
    }

    Self.prototype.resizeSongTitle = function() {
      var link = this.songTitleLink
      var text = this.songTitleText

      link.className = ""
      if (text.offsetWidth > link.clientWidth) {
        link.className = "small"
      }
      if (text.offsetWidth > link.clientWidth) {
        link.className = "x-small"
      }
    }

    Self.prototype.handleQueuedResizeSongTitle = function() {
      this.resizeSongTitle()
      this.queuedResizeSongTitle = null;
    }

    Self.prototype.handleResize = function() {
      if (!this.queuedResizeSongTitle) {
        this.queuedResizeSongTitle = window.requestAnimationFrame(
            this.handleQueuedResizeSongTitle.bind(this))
      }
    }

    Self.prototype.setupBeatBar = function() {
      var root = this.root
      var doc = root.ownerDocument

      var beatBar = doc.createElement("div")
      beatBar.className = "hues-m-beatbar"
      root.appendChild(beatBar)
      this.beatBar = beatBar

      var beatLeft = doc.createElement("div")
      beatLeft.className = "hues-m-beatleft"
      beatBar.appendChild(beatLeft)
      this.beatLeft = beatLeft

      var beatRight = doc.createElement("div")
      beatRight.className = "hues-m-beatright"
      beatBar.appendChild(beatRight)
      this.beatRight = beatRight
      
      var beatCenter = doc.createElement("div")
      beatCenter.className = "hues-m-beatcenter"
      root.appendChild(beatCenter)
      this.beatCenter = beatCenter

      this.hues.addEventListener("beat", this.updateBeatBar.bind(this))
    }

    Self.prototype.setupControls = function() {
      var root = this.root
      var doc = root.ownerDocument

      var controls = doc.createElement("div")
      controls.className = "hues-m-controls"
      root.appendChild(controls)
      this.controls = controls

      var imageName = doc.createElement("div")
      imageName.className = "hues-m-imagename"
      controls.appendChild(imageName)
      this.imageName = imageName
      this.hues.addEventListener("imagechange", this.updateImageName.bind(this))

      var songTitle = doc.createElement("div")
      songTitle.className = "hues-m-songtitle"
      controls.appendChild(songTitle)
      this.songTitle = songTitle
      this.hues.addEventListener("songchange", this.updateSongTitle.bind(this))
    }

    Self.prototype.setupUI = function(root) {
      this.root = root
      var doc = root.ownerDocument

      this.setupBeatBar()
      this.setupControls()

      window.addEventListener("resize", this.handleResize.bind(this))
    }

    return Self;
  })()

  return function(hues) {
    var self = new Self(hues)
    this.setupUI = function(rootElement) {
      self.setupUI(rootElement)
    }
  }
})()
