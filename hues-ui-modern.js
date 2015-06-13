window.HuesUIModern = (function() {
  var Self = (function() {
    var Self = function(hues) {
      this.hues = hues;
    }

    Self.prototype.hues = null

    Self.prototype.root = null

    Self.prototype.styleLink = null

    Self.prototype.beatBar = null
    Self.prototype.beatLeft = null
    Self.prototype.beatRight = null
    Self.prototype.beatCenter = null

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

    Self.prototype.setupUI = function(root) {
      this.root = root
      var doc = root.ownerDocument

      if (!this.styleLink) {
        var styleLink = doc.createElement("link")
        styleLink.rel = "stylesheet"
        styleLink.type = "text/css"
        styleLink.href = "hues-m.css"
        styleLink.media = "all"
        doc.head.appendChild(styleLink)
        this.styleLink = styleLink
      }

      this.setupBeatBar()
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
