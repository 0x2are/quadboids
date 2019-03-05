class Boid {
  constructor(x, y) {
    this.loc = createVector(x, y);
    this.vel = createVector(Math.random(), Math.random());
    this.accel = createVector(0, 0);

    this.maxSpeed = 3;
    this.vel.mult(this.maxSpeed);
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
    desired.setMag(this.maxSpeed);

    const steering = p5.Vector.sub(desired, this.vel);
    steering.limit(maxForce);

    this.applyForce(steering);
  }


  flock() {
    const avgPos = createVector(0, 0);
    const desiredAlign = createVector(0, 0);
    const desiredSep = createVector(0, 0);
    
    const sightRad = 64;
    const desiredSepDist = 20; 
    const maxAlignForce = 0.2;
    const maxSepForce = 0.7;
    const maxGroupForce = 0.15;
    
    const circle = new Circle(this.loc.x, this.loc.y, sightRad);
    const sepCircle = new Circle(this.loc.x, this.loc.y, desiredSepDist);
    const boidsInRange = tree.query(circle);
    const boidsInSepRange = tree.query(sepCircle);
    
    const count = boidsInRange.length - 1; //sub 1 to exclude this
    const sepCount = boidsInSepRange.length - 1;

    for (const b of boidsInRange) {
      if (b != this) {
        avgPos.add(b.loc);
        desiredAlign.add(b.vel);
      }
    }

    for (const b of boidsInSepRange) {
      if (b != this) {
        const bToMe = p5.Vector.sub(this.loc, b.loc);
        const d = bToMe.mag();
            
        bToMe.normalize();
        bToMe.div(d);
        desiredSep.add(bToMe);
      }
    }

    if (count > 0) {
      //group force
      avgPos.div(count);
      const desiredGroup = p5.Vector.sub(avgPos, this.loc);
      desiredGroup.setMag(this.maxSpeed);

      const steeringGroup = p5.Vector.sub(desiredGroup, this.vel);
      steeringGroup.limit(maxGroupForce);

      //align force
      desiredAlign.div(count);
      const steeringAlign = p5.Vector.sub(desiredAlign, this.vel);
      
      steeringAlign.limit(maxAlignForce);
      
      ///apply
      this.applyForce(steeringGroup);
      this.applyForce(steeringAlign);
    }

    //create and apply the separation force
    if (sepCount > 0) {
      desiredSep.div(sepCount);
      desiredSep.setMag(this.maxSpeed);

      const steeringSep = p5.Vector.sub(desiredSep, this.vel);
      steeringSep.limit(maxSepForce);

      this.applyForce(steeringSep);
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

const width = 1280;
const height = 720;
const startingBoids = 100;

let showTree = false;

const boids = [];
const bounds = new AABB(width/2, height/2, width, height);
let tree = new QuadTree(bounds);

function setup() {
  createCanvas(width, height);

  for (let i = 0; i < startingBoids; ++i) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const b = new Boid(x, y);

    boids.push(b);
  }

  rectMode(CENTER);
}


function draw() {
  background(255);

  buildTree();
  
  stroke(255,0,0);

  if (showTree) {
    tree.draw();
  }
  
  stroke(0);
  for (const b of boids) {
    b.update();
    b.draw();
  }

  const circle = new Circle(mouseX, mouseY, 100);
  const closeBoids = tree.query(circle);
  stroke(0,255,0);
  for (const b of closeBoids) {
    ellipse(b.loc.x, b.loc.y, 10, 10);
  }
  
  noStroke();
  fill(255,0,255);
  text(boids.length, 50, 50);
  text(Math.floor(frameRate()), 50, 70);
  noFill();
}


function mouseDragged() {
  boids.push(new Boid(mouseX, mouseY));
}


function keyPressed() {
  if (keyCode == UP_ARROW) {
    showTree = !showTree;
  }
}



function buildTree() {
  tree = new QuadTree(bounds, 4);

  for (const b of boids) {
    tree.insert(b);
  }
}