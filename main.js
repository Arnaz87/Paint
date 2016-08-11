var Coord = function (x,y) {
  this.x = x;
  this.y = y;
};

Coord.prototype.distance = function (other) {
  var a = this.x - other.x;
  var b = this.y - other.y;
  return Math.sqrt(a*a + b*b);
};
Coord.prototype.clone = function () {
  return new Coord(this.x, this.y);
};
Coord.prototype.copy = function (other) {
  this.x = other.x;
  this.y = other.y;
};
Coord.prototype.toAngle = function () {
  var angle = Math.atan2(this.x, this.y);
  var length = Math.sqrt(this.x*this.x + this.y*this.y);
  return new Angle(angle, length);
}
Coord.prototype.plus = function (other) {
  return new Coord(this.x + other.x, this.y + other.y);
}
Coord.prototype.minus = function (other) {
  return new Coord(this.x - other.x, this.y - other.y);
}
Coord.prototype.add = function (other) {
  this.x += other.x;
  this.y += other.y;
}

var Angle = function (angle, length) {
  this.angle = angle;
  this.length = (length==undefined)? 1 : length;
}
Angle.prototype.clone = function () { return new Angle(this.angle, this.length); }
Angle.prototype.normalize = function () { this.length = 1; }
Angle.prototype.normalized = function () { return this.clone().normalize(); }
Angle.prototype.toCoord = function () {
  var x = Math.sin(this.angle) * this.length;
  var y = Math.cos(this.angle) * this.length;
  return new Coord(x, y);
}

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var debugElem = document.getElementById("debug");
function debug (text) { debugElem.textContent = text; }
var brush = {
  elem: document.getElementById("brush"),
  arrow: document.getElementById("brush-arrow"),
  pos: new Coord(0,0),
  radius: 1,
  move: function (pos) {
    this.pos = pos.clone();
    this.elem.style.top =  pos.y + "px";
    this.elem.style.left = pos.x + "px";
  },
  setRadius: function (n) {
    this.radius = n;
    this.elem.style.width = n*2 + "px";
    this.elem.style.height = n*2 + "px";
    this.elem.style.borderRadius = n + "px";
    this.elem.style.marginLeft = -(n+2) + "px";
    this.elem.style.marginTop  = -(n+2) + "px";
  },
  setAngle: function (m) {
    var n = Math.PI/2 - m;
    this.elem.style.transform = "rotate(" + n + "rad)";
  }
};

brush.setRadius(40);
brush.move(new Coord(0.5, 0.5));

var ham = new Hammer(canvas);

canvas.addEventListener("touchstart", function (ev) {
  ev.preventDefault();
});
canvas.addEventListener("touchmove", function (ev) {
  ev.preventDefault();
});

ham.on('panstart', function (ev) {
  var pos = getPosition(ev.center, canvas);
  brush.move(pos);
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y)
  brush.elem.hidden = false;
})
ham.on('panmove', function (ev) {
  var pos = getPosition(ev.center, canvas);
  drag(pos);
});
ham.on('panend', function (ev) {
  ctx.closePath();
  brush.elem.hidden = true;
})

function clean () {
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0,0,canvas.width,canvas.height);
}

clean();

var paints = 0;
var paintTresh = 1;

function drag (pos) {
  var radius = brush.radius;
  var diff = pos.minus(brush.pos);
  var polar = diff.toAngle();
  if (polar.length > radius) {
    polar.length -= radius;
    var npos = brush.pos.plus(polar.toCoord());
    brush.move(npos);
    ctx.lineTo(npos.x, npos.y);
    // Esto de paints es para no forzar el navegador a pintar tanto.
    paints += 1/polar.length;
    if (paints > paintTresh) {
      paints = 0;
      ctx.stroke();
      ctx.closePath();
      ctx.beginPath();
      ctx.moveTo(npos.x, npos.y);
    }
  }
  brush.setAngle(polar.angle);
}

function clamp (t, a, b) {
  if (a == undefined && b == undefined) {
    a = 0; b = 1;
  } else if (b == undefined) {
    b = a; a = 0;
  }
  return (x<a)?a:((x>b)?b:t);
}
function percent (x) { return Math.floor(clamp(x)*100)+"%"; }

function getPosition (center, elem) {
  var rect = elem.getBoundingClientRect();
  return new Coord(
    (center.x - rect.left),
    (center.y - rect.top)
  );
}
function getDimensions (center, elem) {
  var rect = elem.getBoundingClientRect();
  return new Coord(
    (center.x - rect.left) / (rect.right - rect.left),
    (center.y - rect.top) / (rect.bottom - rect.top)
  );
}
function getRelative (pos, elem) {
  var rect = elem.getBoundingClientRect();
  return new Coord(
    pos.x / (rect.right - rect.left),
    pos.y / (rect.bottom - rect.top)
  )
}