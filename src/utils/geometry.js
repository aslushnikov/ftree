var g = {};

g.degToRad = function(deg) {
    return deg / 360 * 2 * Math.PI;
}

g.radToDeg = function(rad) {
    return rad / 2 / Math.PI * 360;
}

g.normalizeRad = function(rad) {
    var div = Math.floor(rad / Math.PI / 2);
    return rad - 2 * Math.PI * div;
}

g.EPS = 1e-7;

g.GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2;

g.eq = function(float1, float2) {
    return Math.abs(float1 - float2) < 1e-7;
}

/**
 * @param {number} r
 * @param {number} segmentLength
 * @return {number}
 */
g.segmentLengthToRad = function(r, segmentLength) {
    var perimeter = 2 * Math.PI * r;
    return (segmentLength / perimeter) * 2 * Math.PI;
}

g.segmentRadToLength = function(r, rad) {
    return rad * r;
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

    subtract(other) {
        return new g.Vec(this.x - other.x, this.y - other.y);
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
     * @param {!g.Vec} other
     * @return {boolean}
     */
    isEqual(other) {
        return g.eq(this.x, other.x) && g.eq(this.y, other.y);
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
    /**
     * @param {!g.Vec} from
     * @param {!g.Vec} to
     * @param {!g.Vec} cp
     */
    constructor(from, to, cp) {
        this.from = from;
        this.to = to;
        this.cp = cp;
    }
}

g.Image = class {
    /**
     * @param {!g.Vec} topLeft
     * @param {!HTMLImageElement} image
     */
    constructor(topLeft, image) {
        this.topLeft = topLeft;
        this.image = image;
    }
}
