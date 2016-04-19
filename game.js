// Initializing the canvas
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

// Canvas dimensions
var W = window.innerWidth; 
var H = window.innerHeight;

canvas.style.width = W;
canvas.style.height = H;
ctx.canvas.width = W;
ctx.canvas.height = H;

// Background music
var bgm = document.getElementById('bgm');
bgm.play();

// Game status variables
var paused = true;
var restart = true;
var crashed = false;
var crashcount = 0;
var level = 1;
var displayText = "";
var currentLevel = 1;
var isTouchScreen = false;
var displayRestartButton = false;

// Mouse variables
var mouseX = 0;
var mouseY = 0;
var mouseDown = false;

// Spaceship variables
var shipImage = new Image();
shipImage.src = 'resources/ship.png';
var shipX = 500;
var shipY = 500;
var shipdX = 0;
var shipdY = 0;
var shipXa = 0;
var shipYa = 0;
var maxFuel = 100;
var currentFuel = 100;

// Goal info
var goalX = -500;
var goalY = -500;
var goalRadius = 40;
var goalOrbitRadius = 0;
var goalOrbitSpeed = 0;
var goalOrbitX = 0;
var goalOrbitY = 0;

var t_inc = 1;
var GRAVITY = 30; // Scaled gravitational constant
// Not actually all that close to real life, but this value gives better gameplay

var konami = false; // Konami code puts you into a bonus mode
var kseq = 0;
var lastKey = 0;
var maxparticles = 100;
var particlespertrail = 5;
var trailindex = 0;
var lastmaxparticles = 20;
var lastmaxparticles2 = 10;
var tryoptimizing = false;
var upcount = 0;

// This is useful later on
Math.hypot = function(cat1, cat2) {
	var sumProd= cat1*cat1 + cat2*cat2;
	return Math.sqrt(sumProd);
}

canvas.addEventListener('mousemove', function(evt) {
	var mousePos = getMousePos(canvas, evt);
	mouseX = mousePos.x;
	mouseY = mousePos.y;}, false);
canvas.addEventListener('mousedown', function(evt) { mouseDown = true; }, false);
canvas.addEventListener('mouseup', function(evt) { mouseDown = false; }, false);
document.addEventListener('keydown', function(evt) { 
	if(evt.keyCode == 32) { 
		paused = !paused; 
		if(paused) bgm.pause();
		else bgm.play();
	}
	else if(evt.keyCode == 77) {
		if(bgm.duration > 0 && !bgm.paused && !paused) bgm.pause();
		else if(bgm.duration > 0 && bgm.paused && !paused) bgm.play();
	}
	else if(evt.keyCode == 82) restartLevel();
	else {
		if(kseq <= 0) {
			if(evt.keyCode == 38) kseq = 1;
		} else {
			if(evt.keyCode == 38 && lastKey == 38 && kseq == 1) kseq = 2;
			else if(evt.keyCode == 40 && lastKey == 38 && kseq == 2) kseq = 3;
			else if(evt.keyCode == 40 && lastKey == 40 && kseq == 3) kseq = 4;
			else if(evt.keyCode == 37 && lastKey == 40 && kseq == 4) kseq = 5;
			else if(evt.keyCode == 39 && lastKey == 37 && kseq == 5) kseq = 6;
			else if(evt.keyCode == 37 && lastKey == 39 && kseq == 6) kseq = 7;
			else if(evt.keyCode == 39 && lastKey == 37 && kseq == 7) kseq = 8;
			else if(evt.keyCode == 66 && lastKey == 39 && kseq == 8) kseq = 9;
			else if(evt.keyCode == 65 && lastKey == 66 && kseq == 9) konami = !konami;
			else kseq = 0;
		}
	}
	lastKey = evt.keyCode;
}, false);
canvas.addEventListener('touchstart', function(evt) { mouseDown = true; mouseX = evt.targetTouches[0].pageX; mouseY = evt.targetTouches[0].pageY; isTouchScreen = true; }, false);
canvas.addEventListener('touchmove', function(evt) { mouseX = evt.targetTouches[0].pageX; mouseY = evt.targetTouches[0].pageY; isTouchScreen = true; }, false);
canvas.addEventListener('touchstop', function(evt) { mouseDown = false; isTouchScreen = true; }, false);

function getMousePos(canvas, evt) {
	var rect = canvas.getBoundingClientRect();
	return {
		x: evt.clientX - rect.left,
		y: evt.clientY - rect.top
	};
}

var masses = [];
var trail = [];

function loadLevel(lv) {
	tryoptimizing = false;
	masses = [];
	trail = [];
	trailindex = 0;
	$.ajax({
		// url: 'levels.php', hosted game uses a PHP file for getting the level and dealing with remembering your current level
		url : "levels/level" + lv + ".json",
		type: "GET",
		cache: false,
		data: { level : lv },
		success: function(json) {
			if(json["ship"] != undefined && json["goal"] != undefined) {
				shipX = json["ship"]["x"];
				shipY = json["ship"]["y"];
				maxFuel = json["ship"]["fuel"];
				currentFuel = maxFuel;
				shipdX = 0;
				shipdY = 0;
				var dx = W/2 - shipX;
				var dy = H/2 - shipY;
				var tm = json["masses"];
				if(tm != undefined) {
					for(var i=0; i<tm.length; i++) {
						var max_mass = (tm[i]["max_mass"] != undefined)? tm[i]["max_mass"] : 0;
						var mass_speed = (tm[i]["mass_speed"] != undefined)? tm[i]["mass_speed"] : 0;
						var max_radius = (tm[i]["max_radius"] != undefined)? tm[i]["max_radius"] : 0;
						var radius_speed = (tm[i]["radius_speed"] != undefined)? tm[i]["radius_speed"] : 0;
						var orbit_radius = (tm[i]["orbit_radius"] != undefined)? tm[i]["orbit_radius"] : 0;
						var orbit_speed = (tm[i]["orbit_speed"] != undefined)? tm[i]["orbit_speed"] : 0;
						var orbit_offset = tm[i]["orbit_offset"];
						masses.push(new createMass(tm[i]["x"],tm[i]["y"],tm[i]["radius"],tm[i]["mass"],tm[i]["color"],tm[i]["corona"],tm[i]["c_color"],max_mass,mass_speed,max_radius,radius_speed,orbit_radius,orbit_speed,orbit_offset));
					}
				}
				goalX = json["goal"]["x"];
				goalY = json["goal"]["y"];
				goalRadius = json["goal"]["radius"];
				goalOrbitRadius = (json["goal"]["orbit_radius"] != undefined)? json["goal"]["orbit_radius"] : 0;
				goalOrbitSpeed = (json["goal"]["orbit_speed"] != undefined)? json["goal"]["orbit_speed"] : 0;
				goalOrbitX = goalX;
				goalOrbitY = goalY;
				if(goalOrbitRadius != 0) goalX += goalOrbitRadius;
				currentLevel = json["level"];
				
				centerShip();
				tryoptimizing = true;
			} else {
				document.title = "Level load error!";
			}
			restart = false;
			paused = false;
			crashed = false;
			crashcount = 0;
			displayText = "";
			displayRestartButton = false;
			mouseDown = false;
		},
		error: function(arg1, arg2) { console.log("Error!" + arg1 + arg2); }
	});
}

function centerShip() {
	var dx = W/2 - shipX;
	var dy = H/2 - shipY;
	shipX = W/2;
	shipY = H/2;
	for(var i=0; i<masses.length; i++) {
		masses[i].x += dx;
		masses[i].y += dy;
		masses[i].orbitX += dx;
		masses[i].orbitY += dy;
	}
	for(var i=0; i<trail.length; i++) {
		trail[i].x += dx;
		trail[i].y += dy;
	}
	goalX += dx;
	goalY += dy;
	goalOrbitX += dx;
	goalOrbitY += dy;
}

function restartLevel() {
	loadLevel(currentLevel);
}

function nextLevel() {
	currentLevel++;
	loadLevel(currentLevel);
}

function createMass(xpos, ypos, rad, m, rgb, coro, coro_color, max_mass, mass_speed, max_radius, radius_speed, orbit_radius, orbit_speed, orbit_offset) {
	this.x = xpos;
	this.y = ypos;
	
	this.color = rgb;
	this.cColor = coro_color;
	this.mass = m;
	
	this.radius = rad;
	this.corona = coro;
	
	//these are optional
	this.maxMass = (max_mass != undefined)? max_mass : m;
	this.minMass = m;
	this.maxRadius = (max_radius != undefined)? max_radius : rad;
	this.minRadius = rad;
	this.orbitRadius = (orbit_radius != undefined)? orbit_radius : 0;
	this.orbitX = this.x;
	this.orbitY = this.y;
	this.orbitFlip = false;
	if(this.orbitRadius > 0 || this.orbitRadius < 0) {
		this.x += this.orbitRadius;
	} 
	if(orbit_offset != undefined) {
		this.x = this.orbitX + this.orbitRadius*Math.cos(orbit_offset * (Math.PI/180));
		this.y = this.orbitY + this.orbitRadius*Math.sin(orbit_offset * (Math.PI/180));
	}
	this.massSpeed = (mass_speed != undefined)? mass_speed : 0;
	this.radiusSpeed = (radius_speed != undefined)? radius_speed : 0;
	this.orbitSpeed = (orbit_speed != undefined)? orbit_speed : 0;
}

function createThrustTrail(tdx, tdy) {
	this.radius = 1; //Math.hypot(Math.abs(xpos-shipX),Math.abs(ypos-shipY));
	this.dx = -tdx;
	this.dy = -tdy;
	this.x = shipX;
	this.y = shipY;
	this.red = Math.random()*255>>128;
	this.green = Math.random()*50>>0;
	this.opacity = 1;
}

function updateShipPos() {
	var theta = 0.0;
	var usedFuel = false;
	var tdx, tdy;
	if(mouseDown && currentFuel > 0) {
		//use fuel
		theta = Math.atan(Math.abs(shipY - mouseY) / Math.abs(shipX - mouseX));
		var xa = Math.abs(Math.cos(theta) * 1);
		var ya = Math.abs(Math.sin(theta) * 1);
		if(mouseX - shipX < 0) xa = xa * -1;
		if(mouseY - shipY < 0) ya = ya * -1;
		shipXa += xa;
		shipYa += ya;
		currentFuel -= 1;
		usedFuel = true;
		tdx = xa * t_inc;
		tdy = ya * t_inc;
	}
	
	// Calculate current acceleration due to the present masses
	for(var i=0; i<masses.length; i++) {
		// The gravitational acceleration acting at this distance
		var g = (GRAVITY * masses[i].mass) / (Math.hypot(Math.abs(shipX - masses[i].x), Math.abs(shipY - masses[i].y)) * Math.hypot(Math.abs(shipX - masses[i].x), Math.abs(shipY - masses[i].y)));
		theta = Math.atan(Math.abs(shipY - masses[i].y) / Math.abs(shipX - masses[i].x));
		var xa = Math.abs(Math.cos(theta) * g);
		var ya = Math.abs(Math.sin(theta) * g);
		if(masses[i].x - shipX < 0) xa = xa * -1;
		if(masses[i].y - shipY < 0) ya = ya * -1;
		if(konami) { ya *= -1; xa *= -1; }
		shipXa += xa;
		shipYa += ya;
	}
	
	shipX += (shipdX * t_inc) + (0.5 * shipXa * (t_inc * t_inc));
	shipY += (shipdY * t_inc) + (0.5 * shipYa * (t_inc * t_inc));
	    
	shipdX += shipXa * t_inc;
	shipdY += shipYa * t_inc;
	
	shipXa = 0;
	shipYa = 0;
	
	if(usedFuel) { 
		trail[trailindex++] = (new createThrustTrail(tdx,tdy));
		if(particlespertrail > 1) trail[trailindex++] = (new createThrustTrail(tdx*1.1,tdy*1.1));
		if(particlespertrail > 2) trail[trailindex++] = (new createThrustTrail(tdx*1.1,tdy-(tdy*0.1)));
		if(particlespertrail > 3) trail[trailindex++] = (new createThrustTrail(tdx-(tdx*0.1),tdy*1.1));
		if(particlespertrail > 4) trail[trailindex++] = (new createThrustTrail(tdx-(tdx*0.1),tdy-(tdy*0.1)));
		/*
		I'm gonna be straight here, I don't know why thsi is commented out. I think I was trying to do something crazy with the particle trail
		trail.push(new createThrustTrail(tdx,tdy));
		if(particlespertrail > 1) trail.push(new createThrustTrail(tdx*1.1,tdy*1.1));
		if(particlespertrail > 2) trail.push(new createThrustTrail(tdx*1.1,tdy-(tdy*0.1)));
		if(particlespertrail > 3) trail.push(new createThrustTrail(tdx-(tdx*0.1),tdy*1.1));
		if(particlespertrail > 4) trail.push(new createThrustTrail(tdx-(tdx*0.1),tdy-(tdy*0.1)));*/
		/*for(var i=0; i<Math.abs(shipX-pX); i++) { 
			if(shipdX > 0 && shipdY > 0) trail.push(new createThrustTrail(pX-i,pY-(Math.abs(shipY-pY)/Math.abs(shipX-pX))));
			else if(shipdX > 0 && shipdY < 0) trail.push(new createThrustTrail(pX-i,pY+(Math.abs(shipY-pY)/Math.abs(shipX-pX))));
			else if(shipdX < 0 && shipdY > 0) trail.push(new createThrustTrail(pX+i,pY-(Math.abs(shipY-pY)/Math.abs(shipX-pX))));
			else if(shipdX < 0 && shipdY < 0) trail.push(new createThrustTrail(pX+i,pY+(Math.abs(shipY-pY)/Math.abs(shipX-pX)))); 
		} */
	}
}

function updateMasses() {
	for(var i=0; i<masses.length; i++) {
		var m = masses[i];
		if(m.maxMass > m.minMass) { 
			m.mass += m.massSpeed;
			if(m.mass >= m.maxMass || m.mass <= m.minMass) m.massSpeed *= -1;
		}
		if(m.maxRadius > m.minRadius) { 
			m.radius += m.radiusSpeed;
			if(m.radius >= m.maxRadius || m.radius <= m.minRadius) m.radiusSpeed *= -1;
		}
		if(m.orbitSpeed != 0) {
			// Polar coordinates make creating a circular path about a thousand times easier
			var theta = Math.atan2((m.y-m.orbitY),(m.x-m.orbitX));
			var r = Math.hypot((m.x-m.orbitX),(m.y-m.orbitY));
			var incangle = m.orbitSpeed * (Math.PI/180);
			theta += incangle;
			// Convert back to Cartesian coordinates
			m.x = m.orbitX + r*Math.cos(theta);
			m.y = m.orbitY + r*Math.sin(theta);
		}
	}
	
}

function updateMap() {
	var adjustX = false;
	var adjustY = false;
	if(shipX < W/5 || shipX > W-(W/5)) adjustX = true;
	if(shipY < W/5 || shipY > H-(W/5)) adjustY = true;
	if(adjustX || adjustY) {
		if(adjustX) shipX -= shipdX*1.01;
		if(adjustY) shipY -= shipdY*1.01;
		if(adjustX) goalX -= shipdX*1.01;
		if(adjustY) goalY -= shipdY*1.01;
		if(adjustX) goalOrbitX -= shipdX*1.01;
		if(adjustY) goalOrbitY -= shipdY*1.01;
		for(var i=0; i<masses.length; i++) {
			if(adjustX) masses[i].x -= shipdX*1.01;
			if(adjustY) masses[i].y -= shipdY*1.01;
			if(adjustX) masses[i].orbitX -= shipdX*1.01;
			if(adjustY) masses[i].orbitY -= shipdY*1.01;
		}
		for(var i=0; i<trail.length; i++) {
			if(adjustX) trail[i].x -= shipdX*1.01;
			if(adjustY) trail[i].y -= shipdY*1.01;
		}
	}
	
	if(currentFuel <= 0 && ((shipdX < 0 && goalX-goalRadius > shipX) || (shipdX > 0 && goalX+goalRadius < shipX) || (shipdY < 0 && goalY-goalRadius > shipY) || (shipdY > 0 && goalY+goalRadius < shipY))) { // No possible win scenario
		if(!isTouchScreen) displayText = "Press 'r' to restart the level"; // Show restart text
		else displayRestartButton = true;
	}
}

function checkCollisions()
{
	for(var i=0; i<masses.length; i++) {
		if(Math.hypot(Math.abs(shipX - masses[i].x),Math.abs(shipY - masses[i].y)) <= masses[i].radius) { 
			crashed = true;
			var tdx = shipdX;
			var tdy = shipdY;
			// Make the explosion
			for(var i=0; i<90; i++) {
				var xspeed = Math.random()*10>>0;
				var yspeed = xspeed * Math.cos(i*Math.PI/180);
				if(shipdX < 0) xspeed *= -1;
				if(shipdY < 0) yspeed *= -1;
				trail[trailindex++] = (new createThrustTrail(xspeed,yspeed));
				//trail.push(new createThrustTrail(xspeed,yspeed));
				/*if(xspeed > yspeed && xspeed > 0) trail.push(new createThrustTrail(xspeed,-yspeed));
				else if(xspeed > yspeed && xspeed < 0) trail.push(new createThrustTrail(xspeed,-yspeed));
				else trail.push(new createThrustTrail(-xspeed,yspeed));*/
				// Also don't know what this ^ is. It's been a while since I've looked at this code.
			}
			// </BOOM>
		}
	}
}

function checkGoal() {
	if(Math.hypot(Math.abs(shipX - goalX),Math.abs(shipY - goalY)) <= goalRadius) { paused = true; nextLevel(); }
	if(goalOrbitSpeed != 0 && goalOrbitRadius != 0) {
		// Polar coordinates make creating a circular path about a thousand times easier
		var theta = Math.atan2((goalY-goalOrbitY),(goalX-goalOrbitX));
		var r = Math.hypot((goalX-goalOrbitX),(goalY-goalOrbitY));
		var incangle = goalOrbitSpeed * (Math.PI/180);
		theta += incangle;
		// Convert back to Cartesian coordinates
		goalX = goalOrbitX + r*Math.cos(theta);
		goalY = goalOrbitY + r*Math.sin(theta);
	}
}

function draw() {
	var startdraw = new Date().getTime(); // I think I was trying to do some particle effect scaling based upon browser draw time...?
	
	if(paused && !isTouchScreen) return;
	if(window.innerWidth != W || window.innerHeight != H) {
		W = window.innerWidth; 
		H = window.innerHeight;	
		canvas.style.width = W;
		canvas.style.height = H;
		ctx.canvas.width = W;
		ctx.canvas.height = H;
		centerShip();
	}
	
	ctx.globalCompositeOperation = "source-over";
	ctx.fillStyle = "rgba(0, 0, 0, 1)";
	ctx.fillRect(0, 0, W, H);
	
	// Let's blend the particle with the background
	ctx.globalCompositeOperation = "lighter";
	
	if(isTouchScreen) {
		if(!displayRestartButton) {	
			ctx.beginPath();
			ctx.fillStyle = 'white';
			if(!paused) {
				ctx.fillRect(W-90,H-90,30,80);
				ctx.fillRect(W-40,H-90,30,80);
			} else {
				ctx.moveTo(W-90,H-90);
				ctx.lineTo(W-10,H-50);
				ctx.lineTo(W-90,H-10);
				ctx.closePath();
				ctx.fill();
			}
			if(mouseDown && mouseX >= W-100 && mouseY >= H-100) {
				mouseDown = false;
				paused = !paused;
				if(paused) bgm.pause();
				else bgm.play();
			}
		}
		if(paused) return;
	}
	
	if(!crashed) updateShipPos();
	updateMap();
	if(crashcount < 3) checkCollisions();
	updateMasses();
	checkGoal();
	
	// Draw the fuel meter
	ctx.fillStyle = "rgba(0, 0, 255, 1)";
	ctx.fillRect(10,10,currentFuel*2,30);
	ctx.beginPath();
	ctx.rect(10,10,maxFuel*2,30);
	ctx.lineWidth = 4;
	ctx.strokeStyle = 'white';
	ctx.stroke();
	ctx.textAlign = 'left';
	ctx.font = "bold 12px sans-serif";
	ctx.fillStyle = 'white';
	ctx.fillText("Fuel", 10, 60);
	
	// Draw the masses
	for(var j = 0; j < masses.length; j++) {
		var m = masses[j];
		
		if(m.x+m.radius < -10 || m.x-m.radius > W+10 || m.y+m.radius < -10 || m.y-m.radius > H+10) continue; // If it's outside our screen, don't draw it.
		ctx.beginPath();
		
		var gradient = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.radius+m.corona);
		gradient.addColorStop(0, m.color);
		gradient.addColorStop(m.radius/(m.radius+m.corona)-0.05, m.color);
		gradient.addColorStop(m.radius/(m.radius+m.corona), m.cColor);
		gradient.addColorStop(m.radius/(m.radius+m.corona), m.cColor);
		gradient.addColorStop(1, "black");
		
		ctx.fillStyle = gradient;
		ctx.arc(m.x, m.y, m.radius+m.corona, Math.PI*2, false);
		ctx.fill();
	}
	
	// Draw fuel trails
	for(var j=0; j<trail.length; j++) {
		if(j>maxparticles) continue;
		var t = trail[j];
		if(t.x+t.radius < -10 || t.x-t.radius > W+10 || t.y+t.radius < -10 || t.y-t.radius > H+10) continue; // If it's outside our screen, don't draw it.
		ctx.beginPath();
		ctx.fillStyle = 'rgba(' + t.red + ',' + t.green + ',0,' + t.opacity + ')';
		ctx.arc(t.x,t.y,t.radius,Math.PI*2,false);
		ctx.fill();
		t.x += t.dx;
		t.y += t.dy;
		t.radius += 0.1;
		t.opacity -= 0.01;
	}
	
	// Draw the goal and goal indicator
	if((goalX+goalRadius < 0 || goalX-goalRadius > W) || (goalY+goalRadius < 0 || goalY-goalRadius > H)) {
		var x1, y1, x2, y2, x3, y3;
		if(goalY+goalRadius < 0) {
			if(goalX >= 5 && goalX <= W-5) x1 = goalX;
			else if(goalX < 5) x1 = 5;
			else x1 = W-5;
			y1 = 0;
			x2 = x1-5;
			y2 = 20;
			x3 = x1+5;
			y3 = y2;
		} else if(goalY-goalRadius > H) {
			if(goalX >= 5 && goalX <= W-5) x1 = goalX;
			else if(goalX < 5) x1 = 5;
			else x1 = W-5;
			y1 = H;
			x2 = x1-5;
			y2 = H-20;
			x3 = x1+5;
			y3 = y2;
		} else if(goalX+goalRadius < 0) {
			if(goalY >= 5 && goalY <= H-5) y1 = goalY;
			else if(goalY < 5) y1 = 5;
			else y1 = H-5;
			x1 = 0;
			y2 = y1-5;
			x2 = 20;
			y3 = y1+5;
			x3 = x2;
		} else {
			if(goalY >= 5 && goalY <= H-5) y1 = goalY;
			else if(goalY < 5) y1 = 5;
			else y1 = H-5;
			x1 = W;
			y2 = y1-5;
			x2 = W-20;
			y3 = y1+5;
			x3 = x2;
		}
		ctx.fillStyle = 'rgba(0,255,0,1)';
		ctx.beginPath();
		ctx.moveTo(x1,y1);
		ctx.lineTo(x2,y2);
		ctx.lineTo(x3,y3);
		ctx.closePath();
		ctx.fill();
		
	}
	
	if(!(goalX+goalRadius < -10 || goalX-goalRadius > W+10 || goalY+goalRadius < -10 || goalY-goalRadius > H+10)) {
		ctx.beginPath();
		ctx.fillStyle = null;
		ctx.strokeStyle = 'green';
		ctx.lineWidth = 3;
		ctx.arc(goalX, goalY, goalRadius, Math.PI*2, false);
		ctx.stroke();
	}
	
	if(displayText != "") {
		ctx.font = "bold 12px sans-serif";
		ctx.fillStyle = 'white';
		ctx.textAlign = 'center';
		ctx.fillText(displayText, W/2, H-24);
	}
	
	if(displayRestartButton) {
		ctx.beginPath();
		ctx.fillStyle = "rgba(128, 0, 0, 1)";
		ctx.rect(W-200,H-80,190,70);
		ctx.fill();
		ctx.lineWidth = 4;
		ctx.strokeStyle = 'white';
		ctx.stroke();
		ctx.font = "bold 24px sans-serif";
		ctx.fillStyle = 'white';
		ctx.textAlign = 'center';
		ctx.fillText("RESTART",W-105,H-35);
		if(mouseDown && mouseX >= W-200 && mouseX <= W-10 && mouseY >= H-80 && mouseY <= H-10) {
			paused = true;
			mouseDown = false;
			restartLevel();
		}
	}
	
	if(crashed) {
		if(crashcount > 25) { paused = true; restartLevel(); }
		crashcount++;
	} else {
		// Draw the ship
		ctx.save();
		var theta = Math.atan(Math.abs(shipY-mouseY)/Math.abs(shipX-mouseX));
		if(mouseX-shipX > 0 && mouseY - shipY < 0) 		theta = Math.PI/2 - theta;
		else if(mouseX-shipX > 0 && mouseY-shipY > 0)	theta += Math.PI/2;
		else if(mouseX-shipX < 0 && mouseY-shipY > 0) 	theta = (Math.PI/2 + theta) * -1;
		else if(mouseX-shipX < 0 && mouseY-shipY < 0) 	theta -= Math.PI/2;
		
		ctx.translate(shipX, shipY);
		ctx.rotate(theta);
		ctx.translate(-16,-16);
		ctx.drawImage(shipImage, 0, 0);
		ctx.restore();
	}
	
	if(tryoptimizing) {
		var enddraw = new Date().getTime();
		lastmaxparticles2 = lastmaxparticles;
		lastmaxparticles = maxparticles;
		if(enddraw - startdraw > 33) {
			maxparticles -= (maxparticles > 10)? 5 : 0;
			if(maxparticles < 60) particlespertrail = 3;
		}
		if(enddraw - startdraw < 10 && maxparticles < 100) {
			upcount++;
			if(upcount > 20) {
				maxparticles+=5;
				if(maxparticles > 60) particlespertrail = 5;
				upcount = 0;
			}
		}
		// Yup, that's totally what I was trying to do
		/*if(maxparticles == lastmaxparticles2 && maxparticles != lastmaxparticles) { 
			//tryoptimizing = false;
			maxparticles = (lastmaxparticles > lastmaxparticles2)? lastmaxparticles2 : lastmaxparticles;
		}*/
	}
	
	// Deal with max particles
	if(trailindex > maxparticles) trailindex = 0;
	
}

restartLevel();
setInterval(draw, 33); // Oh no. Why? This needs to be fixed.
