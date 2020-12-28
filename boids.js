let sightRad = 64;
let sepDistSq = 20 ** 2;

let weights = {
  "group": 0.1,
  "align": 0.7,
  "separate": 0.3
};

let g_boidSpeed = 8;

const width = window.innerWidth;
const height = window.innerHeight;
const startingBoids = 400;

const style = getComputedStyle(document.documentElement);
const hue = style.getPropertyValue("--accent-hue");
const sat = parseInt(style.getPropertyValue("--accent-sat"));

let showTree = false;

const boids = [];
const bounds = new AABB(width/2, height/2, width, height);
let tree = new QuadTree(bounds);
let canvas = null;


function onSliderChange(id) {
  const input = window[id];
  const out = input.getAttribute("out");
  const v = input.value;
  window[out].value = v;
  weights[id] = parseFloat(v);
}

window.onresize = () => {
  resizeCanvas(window.innerWidth, window.innerHeight);
}

class Boid {
  constructor(x, y) {
    this.loc = createVector(x, y);
    this.vel = createVector(Math.random(), Math.random());
    this.accel = createVector(0, 0);

    g_boidSpeed = 6;
    this.vel.mult(g_boidSpeed);
  }


  wrap() {
    if (this.loc.x > width) {
      this.loc.x = 0;
    }

    if (this.loc.x < 0) {
      this.loc.x = width;
    }

    if (this.loc.y > height) {
      this.loc.y = 0;
    }

    if (this.loc.y < 0) {
      this.loc.y = height;
    }
  }


  seek(target) {
    const maxForce = 0.5;

    const desired = p5.Vector.sub(target, this.loc);
    desired.setMag(g_boidSpeed);

    const steering = p5.Vector.sub(desired, this.vel);
    steering.limit(maxForce);

    this.applyForce(steering);
  }

  flee(target) {
    const maxForce = 0.9;

    const desired = p5.Vector.sub(this.loc, target);
    const dist = desired.magSq();
    
    if (dist < 80 ** 2) {
      desired.setMag(g_boidSpeed);
  
      const steering = p5.Vector.sub(desired, this.vel);
      steering.limit(maxForce);
  
      this.applyForce(steering);
    }
  }


  flock() {
    const avgPos = createVector(0, 0);
    const desiredAlign = createVector(0, 0);
    const desiredSep = createVector(0, 0);
    
    const circle = new Circle(this.loc.x, this.loc.y, sightRad);
    const boidsInRange = tree.query(circle);
    
    const count = boidsInRange.length - 1; //sub 1 to exclude this
    let sepCount = 0;

    for (const b of boidsInRange) {
      if (b != this) {
        avgPos.add(b.loc);
        desiredAlign.add(b.vel);

        const diff = p5.Vector.sub(this.loc, b.loc);
        const xds = diff.x ** 2;
        const yds = diff.y ** 2;
        const distSq = xds + yds;

        if (distSq < sepDistSq) {
          ++sepCount;
          diff.div(distSq);
          desiredSep.add(diff);
        }
      }
    }

    if (count > 0) {
      //group force
      avgPos.div(count);
      const desiredGroup = p5.Vector.sub(avgPos, this.loc);
      desiredGroup.setMag(g_boidSpeed);

      const steeringGroup = p5.Vector.sub(desiredGroup, this.vel);
      steeringGroup.limit(weights["group"]);
      this.applyForce(steeringGroup);

      //align force
      desiredAlign.div(count);
      const steeringAlign = p5.Vector.sub(desiredAlign, this.vel);
      steeringAlign.limit(weights["align"]);
      this.applyForce(steeringAlign);

      //separation force
      if (sepCount > 0) {
        desiredSep.div(sepCount);
        desiredSep.setMag(g_boidSpeed);
        const steeringSep = p5.Vector.sub(desiredSep, this.vel);
        steeringSep.limit(weights["separate"]);
        this.applyForce(steeringSep);
      }
      
    }
  }


  applyForce(force) {
    this.accel.add(force);
  }


  update() {
    const mouse = createVector(mouseX, mouseY);

    this.flock();

    if (mouseIsPressed) {
      this.seek(mouse);
    }

    this.vel.add(this.accel);
    this.loc.add(this.vel);

    this.accel.set(0, 0);

    this.wrap();
  }

  draw() {
    const size = 8;
    push()
    translate(this.loc.x, this.loc.y);
    rotate(this.vel.heading());
    ellipse(0, 0, size, size);

    line(0, 0, size/2, 0);
    pop();
  }
}

function setup() {
  canvas = createCanvas(width, height);
  canvas.parent("p5-holder");
  canvas.canvas.classList.add("bgcanv");
  
  colorMode(HSL);
  rectMode(CENTER);
  noFill();

  for (let i = 0; i < startingBoids; ++i) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const b = new Boid(x, y);

    boids.push(b);
  }
}


function draw() {
  clear();

  buildTree();
  
  if (showTree) {
    stroke(hue,sat,20);
    tree.draw();
  }
  
  stroke(hue, sat, 50);
  for (const b of boids) {
    b.update();
    b.draw();
    b.flee(createVector(mouseX, mouseY))
  }

  // text("FPS: " + Math.floor(frameRate()), 50, 170);
}


function keyPressed() {
  if (keyCode == UP_ARROW) {
    showTree = !showTree;
  }
}


function buildTree() {
  tree = new QuadTree(bounds, 1);

  for (const b of boids) {
    tree.insert(b);
  }
}