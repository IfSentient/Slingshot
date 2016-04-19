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

// Music
var bgm = document.getElementById('bgm');
bgm.play();

var paused = true;
var restart = true;
var crashed = false;
var crashcount = 0;
var xview1 = -3000, xview2 = 3000, yview1 = -3000, yview2 = 3000;
var viewsize = 2000;
var mindex = 0;
var tindex = 0;
var completedGoals = 0;
var bestScore = 0;

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
var maxspeed = 100000; // To prevent certain errors

// Goal info
var goalX = -500;
var goalY = -500;
var goalRadius = 40;
var goalOrbit = 0;

var t_inc = 1;
var GRAVITY = 30; // Scaled* gravitational constant
// * Bears no relation with reality

var konami = false; // Shh, it's a secret
var kseq = 0;
var lastKey = 0;

var colors = ['#ffffff','#ff0000','#fff000','#ba0000','#000000','#ffffff','#fff8af','#fff8af','#ffffff','#fff8bc']; // Array of possible star color values
var c_colors = ['#0000ff','#ff0000','#ff0000','#ff4949','#0000ff','#fff000','#ffea00','#ff1d1d','#ee82ee','#fff000']; // Array of possible star corona color values

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
	else if(evt.keyCode == 82) restartGame();
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
canvas.addEventListener('touchstart', function(evt) { mouseDown = true; mouseX = evt.targetTouches[0].pageX; mouseY = evt.targetTouches[0].pageY; }, false);
canvas.addEventListener('touchmove', function(evt) { mouseX = evt.targetTouches[0].pageX; mouseY = evt.targetTouches[0].pageY; }, false);
canvas.addEventListener('touchstop', function(evt) { mouseDown = false; }, false);

function getMousePos(canvas, evt) {
	var rect = canvas.getBoundingClientRect();
	return {
		x: evt.clientX - rect.left,
		y: evt.clientY - rect.top
	};
}

var masses = [];
var trail = [];

function restartGame() {
	masses = [];
	trail = [];
	restart = false;
	paused = false;
	crashed = false;
	crashcount = 0;
	if(!konami) {
		$.ajax({
			url: 'score.php',
			type: "GET",
			data: { score : completedGoals },
			cache: false,
			success: function(json) {
				bestScore = json["score"];
			},
			error: function(arg1, arg2) { console.log("Error!" + arg1 + arg2); }
		});
	}
	completedGoals = 0;
	shipX = W/2;
	shipY = H/2;
	shipdX = 0;
	shipdY = 0;
	maxFuel = 200;
	currentFuel = maxFuel;
	goalX = W/2;
	goalY = -2000;
	xview1 = shipX-(viewsize/2);
	yview1 = shipY-(viewsize/2);
	xview2 = shipX+(viewsize/2);
	yview2 = shipY+(viewsize/2);
	mindex = 0;
	tindex = 0;
	mouseDown = false;
	createStartMasses();
}

function changeGoal() {
	var addX = Math.floor(Math.random()*6000+1000);
	if(addX%2 == 0) goalX += addX;
	else goalX -= addX;
	var addY = Math.floor(Math.random()*6000+1000);
	if(addY%2 == 0) goalY += addY;
	else goalY -= addY;
	goalRadius = Math.random()*300+40;
	completedGoals++;
	if(completedGoals % 5 == 0 && maxFuel > 75) maxFuel -= 25;
	currentFuel = maxFuel;
}

function createStartMasses() {
	for(var i=0; i<(Math.random()*30+30); i++) {
		var idx = Math.floor(Math.random() * colors.length);
		//"rgba("+cr+", "+cg+", "+cb+", 0.5)"
		var pn = Math.floor(Math.random() * 200);
		if(pn % 2 == 0) pn = -1;
		else pn = 1;
		var pn2 = Math.floor(Math.random() * 200);
		if(pn2 % 2 == 0) pn2 = -1;
		else pn2 = 1;
		var rad = Math.random()*50+Math.random()*20+10;
		var ms = rad*2+Math.random()*40;
		var mx = 0, my = 0;
		var conflict = true;
		do {
			conflict = false;
			mx = shipX + (Math.random()*(viewsize/2 + 800) + 200)*pn;
			my = shipY + (Math.random()*(viewsize/2 + 800) + 200)*pn2;
			if(mx > (goalX - goalRadius) && mx < (goalX + goalRadius) && goalY > (goalY - goalRadius) && my < (goalY + goalRadius)) conflict = true;
		} while(conflict);
		masses[mindex] = new createMass(mx,my,rad,ms,colors[idx],Math.random()*20+10,c_colors[idx]);//,0,0,50,Math.random(),100,5));
		mindex++;
		if(mindex > 299) mindex = 0;
	}
}

function addMasses() {
	var seed = completedGoals;
	if(seed > 15) seed = 15;
	if(shipX < xview1) {
		for(var i=0; i<(Math.random()*seed+5); i++) {
			var idx = Math.floor(Math.random() * colors.length);
			var rad = Math.random()*50+Math.random()*20+10;
			var ms = rad*2+Math.random()*40;
			do {
				conflict = false;
				mx = (xview1) - 1000 - Math.random()*1000;
				my = yview1+Math.random()*(Math.abs(yview1-yview2));
				if(mx > (goalX - goalRadius) && mx < (goalX + goalRadius) && goalY > (goalY - goalRadius) && my < (goalY + goalRadius)) conflict = true;
				else {
					for(var j=0; j<masses.length; j++) { if(mx < masses[j].x+masses[j].radius && mx > masses[j].x-masses[j].radius && my < masses[j].y+masses[j].radius && my > masses[j].y-masses[j].radius) conflict = true; }
				}
			} while(conflict);
			masses[mindex] = new createMass(mx,my,rad,ms,colors[idx],Math.random()*20+10,c_colors[idx]);//,0,0,50,Math.random(),100,5));
			mindex++;
			if(mindex > 299) mindex = 0;
		}
		xview1 -= 1000;
		xview2 = xview1 + viewsize;
	} else if(shipX > xview2) {
		for(var i=0; i<(Math.random()*seed+5); i++) {
			var idx = Math.floor(Math.random() * colors.length);
			var rad = Math.random()*50+Math.random()*20+10;
			var ms = rad*2+Math.random()*40;
			do {
				conflict = false;
				mx = (xview2) + 1000 + Math.random()*1000;
				my = yview1+Math.random()*(Math.abs(yview1-yview2));
				if(mx > (goalX - goalRadius) && mx < (goalX + goalRadius) && goalY > (goalY - goalRadius) && my < (goalY + goalRadius)) conflict = true;
				else {
					for(var j=0; j<masses.length; j++) { if(mx < masses[j].x+masses[j].radius && mx > masses[j].x-masses[j].radius && my < masses[j].y+masses[j].radius && my > masses[j].y-masses[j].radius) conflict = true; }
				}
			} while(conflict);
			masses[mindex] = new createMass(mx,my,rad,ms,colors[idx],Math.random()*20+10,c_colors[idx]);//,0,0,50,Math.random(),100,5));
			mindex++;
			if(mindex > 299) mindex = 0;
		}
		xview2 += 1000;
		xview1 = xview2 - viewsize;
	}
	if(shipY < yview1) {
		for(var i=0; i<(Math.random()*seed+5); i++) {
			var idx = Math.floor(Math.random() * colors.length);
			var rad = Math.random()*50+Math.random()*20+10;
			var ms = rad*2+Math.random()*40;
			do {
				conflict = false;
				mx = xview1+Math.random()*Math.abs(xview1-xview2);
				my = yview1 - 1000 - Math.random()*1000;
				if(mx > (goalX - goalRadius) && mx < (goalX + goalRadius) && goalY > (goalY - goalRadius) && my < (goalY + goalRadius)) conflict = true;
				else {
					for(var j=0; j<masses.length; j++) { if(mx < masses[j].x+masses[j].radius && mx > masses[j].x-masses[j].radius && my < masses[j].y+masses[j].radius && my > masses[j].y-masses[j].radius) conflict = true; }
				}
			} while(conflict);
			masses[mindex] = new createMass(mx,my,rad,ms,colors[idx],Math.random()*20+10,c_colors[idx]);//,0,0,50,Math.random(),100,5));
			mindex++;
			if(mindex > 299) mindex = 0;
		}
		yview1 -= 1000;
		yview2 = yview1 + viewsize;
	} else if(shipY > yview2) {
		for(var i=0; i<(Math.random()*seed+5); i++) {
			var idx = Math.floor(Math.random() * colors.length);
			var rad = Math.random()*50+Math.random()*20+10;
			var ms = rad*2+Math.random()*40;
			do {
				conflict = false;
				mx = xview1+Math.random()*Math.abs(xview1-xview2);
				my = yview2 + 1000 + Math.random()*1000;
				if(mx > (goalX - goalRadius) && mx < (goalX + goalRadius) && goalY > (goalY - goalRadius) && my < (goalY + goalRadius)) conflict = true;
				else {
					for(var j=0; j<masses.length; j++) { if(mx < masses[j].x+masses[j].radius && mx > masses[j].x-masses[j].radius && my < masses[j].y+masses[j].radius && my > masses[j].y-masses[j].radius) conflict = true; }
				}
			} while(conflict);
			masses[mindex] = new createMass(mx,my,rad,ms,colors[idx],Math.random()*20+10,c_colors[idx]);//,0,0,50,Math.random(),100,5));
			mindex++;
			if(mindex > 299) mindex = 0;
		}
		yview2 += 1000;
		yview1 = yview2 - viewsize;
	}
}


function centerShip() {
	var dx = W/2 - shipX;
	var dy = H/2 - shipY;
	shipX = W/2;
	shipY = H/2;
	for(var i=0; i<masses.length; i++) {
		masses[i].x += dx;
		masses[i].y += dy;
	}
	for(var i=0; i<trail.length; i++) {
		trail[i].x += dx;
		trail[i].y += dy;
	}
	/*goalX += dx;
	goalY += dy;
	xview1 += dx;
	xview2 += dx;*/
}

function createMass(xpos, ypos, rad, m, rgb, coro, coro_color, max_mass, mass_speed, max_radius, radius_speed, orbit_radius, orbit_speed) {
	this.x = xpos;
	this.y = ypos;
	
	this.color = rgb;
	this.cColor = coro_color;
	this.mass = m;
	
	this.radius = rad;
	this.corona = coro;
	
	// These are optional
	this.maxMass = (max_mass != undefined)? max_mass : m;
	this.minMass = m;
	this.maxRadius = (max_radius != undefined)? max_radius : rad;
	this.minRadius = rad;
	this.orbitRadius = (orbit_radius != undefined)? orbit_radius : 0;
	this.orbitX = this.x;
	this.orbitY = this.y;
	if(this.orbitRadius > 0 || this.orbitRadius < 0) {
		this.y -= this.orbitRadius-1;
		this.x += 1;
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
		// Use fuel
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
		var bug = (konami)? -1 : 1;
		var g = (GRAVITY * masses[i].mass) / (Math.hypot(Math.abs(shipX - masses[i].x), Math.abs(shipY - masses[i].y)) * Math.hypot(Math.abs(shipX - masses[i].x), Math.abs(shipY - masses[i].y)));
		theta = Math.atan(Math.abs(shipY - masses[i].y) / Math.abs(shipX - masses[i].x));
		var xa = Math.abs(Math.cos(theta) * g) * bug;
		var ya = Math.abs(Math.sin(theta) * g) * bug;
		if(masses[i].x - shipX < 0) xa = xa * -1;
		if(masses[i].y - shipY < 0) ya = ya * -1;
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
		if(tindex > 94) tindex = 0;
		trail[tindex] = new createThrustTrail(tdx,tdy);
		trail[++tindex] = new createThrustTrail(tdx*1.1,tdy*1.1);
		trail[++tindex] = new createThrustTrail(tdx*1.1,tdy-(tdy*0.1));
		trail[++tindex] = new createThrustTrail(tdx-(tdx*0.1),tdy*1.1);
		trail[++tindex] = new createThrustTrail(tdx-(tdx*0.1),tdy-(tdy*0.1));
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
		for(var i=0; i<masses.length; i++) {
			if(adjustX) masses[i].x -= shipdX*1.01;
			if(adjustY) masses[i].y -= shipdY*1.01;
		}
		for(var i=0; i<trail.length; i++) {
			if(adjustX) trail[i].x -= shipdX*1.01;
			if(adjustY) trail[i].y -= shipdY*1.01;
		}
		xview1 -= shipdX;
		xview2 -= shipdX;
		yview1 -= shipdY;
		yview2 -= shipdY;
	}
	
	if(currentFuel <= 0 && ((shipdX < 0 && goalX-goalRadius > shipX) || (shipdX > 0 && goalX+goalRadius < shipX) || (shipdY < 0 && goalY-goalRadius > shipY) || (shipdY > 0 && goalY+goalRadius < shipY))) { // No possible win scenario
		//displayText = "Press 'r' to restart the level";//show restart text
	}
}

function checkCollisions() {
	 if(!crashed) {
		for(var i=0; i<masses.length; i++) {
			if(Math.hypot(Math.abs(shipX - masses[i].x),Math.abs(shipY - masses[i].y)) <= masses[i].radius) { 
				crashed = true;
				break;
			} else {
				if(/*Math.abs(shipdX) > masses[i].radius && */Math.hypot(Math.abs(shipX - masses[i].x),Math.abs(shipY - masses[i].y)) < Math.abs(shipdX)) {
					console.log('x');
					var xcheck = shipX - shipdX;
					var ycheck = shipY - shipdY;
					var ysegment = shipdY/Math.abs(shipdX/(masses[i].radius-1));
					var xsegment = 1;
					if(shipdX < 0) xsegment = -1;
					for(var j=0; j<Math.abs(shipdX/(masses[i].radius-1)); j++) {
						xcheck += (j*(masses[i].radius-1)*xsegment);
						ycheck += ysegment;
						if(Math.hypot(Math.abs(xcheck - masses[i].x),Math.abs(ycheck - masses[i].y)) <= masses[i].radius) { 
							crashed = true;
							shipX = xcheck;
							shipY = ycheck;
							break;
						}
					}
				}
				if(/*Math.abs(shipdY) > masses[i].radius && */Math.hypot(Math.abs(shipX - masses[i].x),Math.abs(shipY - masses[i].y)) < Math.abs(shipdY)) {
					console.log('y');
					var xcheck = shipX - shipdX;
					var ycheck = shipY - shipdY;
					var xsegment = shipdX/Math.abs(shipdY/(masses[i].radius-1));
					var ysegment = 1;
					if(shipdy < 0) ysegment = -1;
					for(var j=0; j<Math.abs(shipdY/(masses[i].radius-1)); j++) {
						ycheck += (j*(masses[i].radius-1)*ysegment);
						xcheck += xsegment;
						if(Math.hypot(Math.abs(xcheck - masses[i].x),Math.abs(ycheck - masses[i].y)) <= masses[i].radius) { 
							crashed = true;
							shipX = xcheck;
							shipY = ycheck;
							break;
						}
					}
				}
			}
		}
	}
	
	if(crashed) {
		var tdx = shipdX;
		var tdy = shipdY;
		//make the explosion
		for(var i=0; i<90; i++) {
			var xspeed = Math.random()*10>>0;
			var yspeed = xspeed * Math.cos(i*Math.PI/180);
			trail[tindex] = new createThrustTrail(xspeed,yspeed);
			tindex++;
			if(tindex > 99) tindex = 0;
		}
	}
}

function checkGoal() {
	if(Math.hypot(Math.abs(shipX - goalX),Math.abs(shipY - goalY)) <= goalRadius) changeGoal();
}

function draw() {
	if(paused) return;
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
	
	if(!crashed) updateShipPos();
	if(!crashed) updateMap();
	if(crashcount < 3) checkCollisions();
	updateMasses();
	checkGoal();
	addMasses();
	
	/*ctx.beginPath();
	ctx.strokeStyle = 'white';
	ctx.lineWidth = 4;
	ctx.rect(xview1,yview1,Math.abs(xview2-xview1),Math.abs(yview2-yview1));
	ctx.stroke();*/
	
	// Draw the fuel meter
	ctx.fillStyle = "rgba(0, 0, 255, 1)";
	ctx.fillRect(10,10,currentFuel*2,30);
	ctx.beginPath();
	ctx.rect(10,10,maxFuel*2,30);
	ctx.lineWidth = 4;
	ctx.strokeStyle = 'white';
	ctx.stroke();
	ctx.font = "bold 12px sans-serif";
	ctx.fillStyle = 'white';
	ctx.textAlign = 'left';
	ctx.fillText("Fuel: " + currentFuel + "/" + maxFuel, 10, 60);
	
	// Draw the masses
	for(var j = 0; j < masses.length; j++) {
		var m = masses[j];
		
		if(m.x+m.radius < -10 || m.x-m.radius > W+10 || m.y+m.radius < -10 || m.y-m.radius > H+10) continue; //if it's outside our screen, don't draw it.
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
		var t = trail[j];
		if(t.x+t.radius < -10 || t.x-t.radius > W+10 || t.y+t.radius < -10 || t.y-t.radius > H+10) continue; //if it's outside our screen, don't draw it.
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
			if(goalX >= 10 && goalX <= W-10) x1 = goalX;
			else if(goalX < 10) x1 = 10;
			else x1 = W-10;
			y1 = 0;
			x2 = x1-10;
			y2 = 30;
			x3 = x1+10;
			y3 = y2;
		} else if(goalY-goalRadius > H) {
			if(goalX >= 10 && goalX <= W-10) x1 = goalX;
			else if(goalX < 10) x1 = 10;
			else x1 = W-10;
			y1 = H;
			x2 = x1-10;
			y2 = H-30;
			x3 = x1+10;
			y3 = y2;
		} else if(goalX+goalRadius < 0) {
			if(goalY >= 10 && goalY <= H-10) y1 = goalY;
			else if(goalY < 10) y1 = 10;
			else y1 = H-10;
			x1 = 0;
			y2 = y1-10;
			x2 = 30;
			y3 = y1+10;
			x3 = x2;
		} else {
			if(goalY >= 10 && goalY <= H-10) y1 = goalY;
			else if(goalY < 10) y1 = 10;
			else y1 = H-10;
			x1 = W;
			y2 = y1-10;
			x2 = W-30;
			y3 = y1+10;
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
		ctx.fillStyle = 'black';
		ctx.strokeStyle = 'green';
		ctx.lineWidth = 3;
		ctx.arc(goalX, goalY, goalRadius, Math.PI*2, false);
		ctx.stroke();
	}
	
	if(currentFuel <= 0) {
		ctx.font = "bold 12px sans-serif";
		ctx.fillStyle = 'white';
		ctx.textAlign = 'center';
		ctx.fillText("Press 'r' to restart", W/2, H-24);
	}
	
	ctx.font = "bold 12px sans-serif";
	ctx.fillStyle = 'white';
	ctx.textAlign = 'right';
	ctx.fillText("Goals completed: " + completedGoals, W-10, 20);
	ctx.fillText("Personal Best: " + bestScore, W-10, 40);
	
	if(crashed) {
		if(crashcount > 25) { paused = true; restartGame(); }
		crashcount++;
	} else {
		//draw the ship
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
	
}

restartGame();
setInterval(draw, 33); // Seriously, I need to be stopped. Why would I do this? Why?
