var g = {};

g.degToRad = function(deg) {
    return deg / 360 * 2 * Math.PI;
}

g.radToDeg = function(rad) {
    return rad / 2 / Math.PI * 360;
}

g.Vec = class {
    /**
     * @param {number} x
     * @param {number} y
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * @param {!g.Vec} other
     * @return {!g.Vec}
     */
    add(other) {
        return new g.Vec(this.x + other.x, this.y + other.y);
    }

    /**
     * @param {number} k
     * @return {!g.Vec}
     */
    scale(k) {
        return new g.Vec(this.x * k, this.y * k);
    }

    len() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /**
     * @param {!g.Vec} other
     * @return {number}
     */
    angleTo(other) {
        return Math.atan2(this.y - other.y, this.x - other.x);
    }

    /**
     * @param {number} r
     * @param {number} angle
     * @return {!g.Vec}
     */
    static fromRadial(r, angle) {
        return new g.Vec(r * Math.cos(angle), r * Math.sin(angle));
    }
}

g.zeroVec = new g.Vec(0, 0);

/**
 * @param {number} r
 * @param {number} segmentLength
 * @return {number}
 */
g.segmentLengthToRad = function(r, segmentLength) {
    var perimeter = 2 * Math.PI * r;
    return (segmentLength / perimeter) * 2 * Math.PI;
}

g.Line = class {
    /**
     * @param {!g.Vec} from
     * @param {!g.Vec} to
     */
    constructor(from, to) {
        this.from = from;
        this.to = to;
    }
}

g.Arc = class {
    /**
     * @param {!g.Vec} center
     * @param {!g.Vec} r
     * @param {number} fromAngle
     * @param {number} toAngle
     */
    constructor(center, r, fromAngle, toAngle) {
        this.center = center;
        this.r = r;
        this.fromAngle = fromAngle;
        this.toAngle = toAngle;

        var fromVec = g.Vec.fromRadial(r, fromAngle);
        var toVec = g.Vec.fromRadial(r, toAngle);
        this.from = this.center.add(fromVec);
        this.to = this.center.add(toVec);
    }
}

g.Bezier = class {
    constructor(from, to, cp) {
        this.from = from;
        this.to = to;
        this.cp = cp;
    }
}
