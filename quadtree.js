class Circle {
  constructor(x, y, r) {
    this.x = x;
    this.y = y;
    this.r = r;
  }


  contains(point) {
    const xDist = point.x - this.x;
    const yDist = point.y - this.y;
    const distSq = xDist * xDist + yDist * yDist;

    return distSq < this.r * this.r;
  }


  draw() {
    ellipse(this.x, this.y, this.r*2, this.r*2);
  }
}


class AABB {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;

    this.hw = this.w/2.;
    this.hh = this.h/2.;

    this.l = this.x - this.hw;
    this.r = this.x + this.hw;
    this.t = this.y - this.hh;
    this.b = this.y + this.hh;
  }


  intersectsRect(aabb) {
    return !(
      (this.l > aabb.r) ||
      (this.r < aabb.l) ||
      (this.t > aabb.b) ||
      (this.b < aabb.t)
    );
  }


  intersectsCircle(circle) {
    if (this.contains(circle))
    {
      return true;
    }

    const toRight = circle.x > this.r;
    const toLeft = circle.x < this.l;
    const above = circle.y < this.t;
    const below = circle.y > this.b;
    const inCorner = (toRight || toLeft) && (above || below);
    let ans = false;
    
    if (inCorner) {
      let rectX = this.x;
      let rectY = this.y;

      //calculate the closest corner of the AABB
      //to the circle
      if (toRight) {
        rectX += this.hw;
      } else if (toLeft) {
        rectX -= this.hw;
      }

      if (above) {
        rectY -= this.hh;
      } else if (below) {
        rectY += this.hh;
      }

      //if the distance from rectPoint to the circle is less than the radius,
      //then the circle is intersecting
      const xDist = circle.x - rectX;
      const yDist = circle.y - rectY;
      const distSq = xDist * xDist + yDist * yDist;

      ans = distSq <= circle.r*circle.r;
    }
    else { //not in corner
      const lr = abs(circle.x - this.x) - circle.r <= this.hw;
      const tb = abs(circle.y - this.y) - circle.r <= this.hh;

      ans = lr && tb;
    }

    return ans;
  }


  //generic intersects method for use with other AABB or circle
  intersects(area) {
    if (area instanceof Circle) {
      return this.intersectsCircle(area);
    }
    else {
      return this.intersectsRect(area);
    }
  }


  contains(p) {
    return !(
      p.x < this.l ||
      p.x > this.r ||
      p.y < this.t ||
      p.y > this.b
    );
  }


  draw() {
    rect(this.x, this.y, this.w, this.h);
  }
}


class QuadTree {
  constructor(bounds, capacity = 3) {
    this.bounds = bounds;
    this.parent = parent;
    this.capacity = capacity;
    this.points = [];
    this.divided = false;
  }


  subdivide() {
    const halfW = this.bounds.hw;
    const halfH = this.bounds.hh;
    const quarW = halfW/2;
    const quarH = halfH/2;

    //right, left, top and bot. X and Y values
    //to create the center points of the new boxes
    const r = this.bounds.x + quarW; 
    const l = this.bounds.x - quarW;
    const t = this.bounds.y - quarH;
    const b = this.bounds.y + quarH;

    const neBox = new AABB(r, t, halfW, halfH);
    const nwBox = new AABB(l, t, halfW, halfH);
    const seBox = new AABB(r, b, halfW, halfH);
    const swBox = new AABB(l, b, halfW, halfH);

    this.ne = new QuadTree(neBox, this.capacity);
    this.nw = new QuadTree(nwBox, this.capacity);
    this.se = new QuadTree(seBox, this.capacity);
    this.sw = new QuadTree(swBox, this.capacity);
    
    this.divided = true;
  }


  insert(boid) {
    const point = boid.loc;

    if (this.bounds.contains(point)) {
      if (!this.divided) {
        //either add the point or split
        //if it splits here then the point
        //will be added in the next block
        if (this.points.length < this.capacity) {
          this.points.push(boid);
        }
        else {
          this.subdivide();
        }
      }
      
      //could have subdivided in previous if, so check agian
      if (this.divided) { 
        //add the point to the appropriate subtree
        //only the quadrant containing the point will accept it
        this.ne.insert(boid);
        this.nw.insert(boid);
        this.se.insert(boid);
        this.sw.insert(boid);
      }

    }
  }


  query(area, found = []) {
    if (this.bounds.intersects(area)) {
      for (const b of this.points) {
        if (area.contains(b.loc)) {
          found.push(b);
        }
      }

      if (this.divided) {
        this.ne.query(area, found);
        this.nw.query(area, found);
        this.se.query(area, found);
        this.sw.query(area, found);
      }
    }

    return found;
  }


  draw() {
    //draw boundary
    this.bounds.draw();

    //draw subtrees
    if (this.divided) {
      this.ne.draw();
      this.nw.draw();
      this.se.draw();
      this.sw.draw();
    }
  }
}