app.Layout = class {
    /**
     * @param {!Map<!app.Person, !g.Vec} positions
     * @param {!Map<!app.Person, number} rotations
     * @param {!Array<!Object>} scaffolding
     * @param {number} personRadius
     */
    constructor(positions, rotations, scaffolding, personRadius) {
        this.positions = positions;
        this.rotations = rotations;
        this.scaffolding = scaffolding;
        this.personRadius = personRadius;
    }

    /**
     * @return {x: number, y: number, width: number, height: number}
     */
    boundingBox() {
        if (this._boundingBox)
            return this._boundingBox;
        if (!this.positions.size)
            return {x: 0, y: 0, width: 0, height: 0};
        var minX = Infinity;
        var minY = Infinity;
        var maxX = -Infinity;
        var maxY = -Infinity;
        for (var position of this.positions.values()) {
            minX = Math.min(minX, position.x);
            minY = Math.min(minY, position.y);
            maxX = Math.max(maxX, position.x);
            maxY = Math.max(maxY, position.y);
        }
        return {x: minX, y: minY, width: maxX - minX, height: maxY - minY};
    }

    /**
     * @return {!app.Layout}
     */
    static empty() {
        return new app.Layout(new Map(), new Map(), [], 0);
    }
}

app.LayoutEngine = class extends EventEmitter {
    /**
     * @return {boolean}
     */
    isDirty() { }

    /**
     * @return {!app.Layout}
     */
    layout() { }
}

app.LayoutEngine.Events = {
    LayoutRecalculated: Symbol("LayoutRecalculated"),
}

app.SunLayout = class extends app.LayoutEngine {
    constructor() {
        super();
        this._familyTree = null;
        this._size = 600;
        this._nodeRadius = 25;
        this._overlap = 0;
        this._initialRotation = 0;

        /** @type {!Map<!app.Person, number>} */
        this._subtreeSize = new Map();
        /** @type {!Map<!app.Person, number>} */
        this._subtreeDepth = new Map();
        /** @type {!Map<!app.Person, number>} */
        this._nodeDepth = new Map();

        this._isDirty = false;
        /** @type {!app.Layout} */
        this._lastLayout = app.Layout.empty();
    }

    /**
     * @return {boolean}
     */
    isDirty() {
        return this._isDirty;
    }

    /**
     * @param {!app.FamilyTree} familyTree
     */
    setFamilyTree(familyTree) {
        this._isDirty = true;
        this._familyTree = familyTree;
        this._initializeSubtreeSizesAndDepths();
    }

    /**
     * @param {number} radius
     */
    setPersonRadius(radius) {
        if (g.eq(radius, this._nodeRadius))
            return;
        this._nodeRadius = radius;
        this._isDirty = true;
    }

    /**
     * @return {number}
     */
    personRadius() {
        return this._nodeRadius;
    }

    setInitialRotation(rotation) {
        if (g.eq(rotation, this._initialRotation))
            return;
        this._initialRotation = rotation;
        this._isDirty = true;
    }

    initialRotation() {
        return this._initialRotation;
    }

    /**
     * @param {number} size
     */
    setSize(size) {
        if (g.eq(size, this._size))
            return;
        this._size = size;
        this._isDirty = true;
    }

    /**
     * @return {number}
     */
    size() {
        return this._size;
    }

    /**
     * @param {number} overlap
     */
    setOverlap(overlap) {
        if (g.eq(overlap, this._overlap))
            return;
        this._overlap = overlap;
        this._isDirty = true;
    }

    /**
     * @return {number}
     */
    overlap() {
        return this._overlap;
    }

    /**
     * @return {number}
     */
    _depthRadiusStep() {
        return (this._size - this._nodeRadius) / 2 / this._familyTreeDepth;
    }

    /**
     * @return {!app.Layout}
     */
    layout() {
        if (!this._isDirty)
            return this._lastLayout;
        this._isDirty = false;
        if (!this._familyTree) {
            this._lastLayout = app.Layout.empty();
            return this._lastLayout;
        }
        var rotations = this._computeRotations();
        var positions = this._computePositions(rotations);
        var scaffolding = this._computeScaffolding(rotations, positions);
        this._lastLayout = new app.Layout(positions, rotations, scaffolding, this._nodeRadius);
        this.dispatch(app.LayoutEngine.Events.LayoutRecalculated);
        return this._lastLayout;
    }

    _computeScaffolding(rotations, positions) {
        var scaffolding = [];

        // Render family arcs.
        for (var node of rotations.keys()) {
            var children = node.children;
            if (!children.size)
                continue;
            var r = (this._nodeDepth.get(node) + 1) * this._depthRadiusStep();
            var min = Infinity;
            var max = -Infinity;
            for (var child of children) {
                var angle = rotations.get(child);
                min = Math.min(min, angle);
                max = Math.max(max, angle);
            }

            if (g.eq(min, max)) {
                // There is a sole child. Render a level join straight to it.
                var joinStart = positions.get(node);
                var joinEnd = g.Vec.fromRadial(r, rotations.get(node));
                scaffolding.push(new g.Line(joinStart, joinEnd));
                continue;
            }

            var offset = this._nodeRadius * 2;
            // Level join.
            var joinStart = positions.get(node);
            var joinEnd = g.Vec.fromRadial(r - offset, rotations.get(node));
            scaffolding.push(new g.Line(joinStart, joinEnd));

            // Do scaffolding.
            var totalArcLength = g.segmentRadToLength(r - offset, max - min);
            var maxCurveRadius = this._nodeRadius;
            var curveRadius = Math.min(totalArcLength / 2, maxCurveRadius);
            var curveOffsetRad = g.segmentLengthToRad(r - offset, curveRadius);

            var start1 = g.Vec.fromRadial(r - offset, min + curveOffsetRad);
            var start2 = g.Vec.fromRadial(r - offset, max - curveOffsetRad);
            var end1 = g.Vec.fromRadial(r - offset + curveRadius, min);
            var end2 = g.Vec.fromRadial(r - offset + curveRadius, max);
            var cp1 = g.Vec.fromRadial(r - offset, min);
            var cp2 = g.Vec.fromRadial(r - offset, max);
            scaffolding.push(new g.Arc(g.zeroVec, r - offset, min + curveOffsetRad, max - curveOffsetRad));
            scaffolding.push(new g.Bezier(start1, end1, cp1));
            scaffolding.push(new g.Bezier(start2, end2, cp2));

            for (var child of children) {
                var rotation = rotations.get(child);
                var from = g.Vec.fromRadial(r - offset, rotation);
                if (g.eq(rotation, min))
                    from = end1;
                else if (g.eq(rotation, max))
                    from = end2;
                scaffolding.push(new g.Line(from, g.Vec.fromRadial(r, rotation)));
            }
        }
        return scaffolding;
    }

    /**
     * @param {!Map<!app.Person, number>} rotations
     * @return {!Map<!app.Person, !g.Vec>}
     */
    _computePositions(rotations) {
        var positions = new Map();
        positions.set(this._familyTree.root(), new g.Vec(0, 0));
        for (var node of rotations.keys()) {
            var r = this._nodeDepth.get(node) * this._depthRadiusStep();
            var angle = rotations.get(node);
            positions.set(node, g.Vec.fromRadial(r, angle));
        }
        return positions;
    }

    /**
     * @return {!Map<!app.Person, number>}
     */
    _computeRotations() {
        /** @type {!Map<!app.Person, number>} */
        var rotations = new Map();
        var leafs = [];
        populateLeafNodes.call(this, this._familyTree.root(), leafs);

        // assign initial positions to leafs.
        var required = 0;
        for (var i = 1; i < leafs.length; ++i)
            required += minAngleForNode.call(this, leafs[i]);
        var total = 2 * Math.PI + this._overlap;
        var free = total - required;
        var freeQuant = free / leafs.length;

        var last = this._initialRotation;
        rotations.set(leafs[0], last);
        for (var i = 1; i < leafs.length; ++i) {
            var prevLeaf = leafs[i - 1];
            var leaf = leafs[i];
            var value = last + minAngleForNode.call(this, prevLeaf) + freeQuant;
            rotations.set(leaf, value);
            last = value;
        }
        layoutTree.call(this, this._familyTree.root());
        return rotations;

        /**
         * @param {!app.Person] node
         */
        function layoutTree(node) {
            if (rotations.has(node))
                return;
            for (var child of node.children)
                layoutTree.call(this, child);
            var min = Infinity;
            var max = -Infinity;
            var families = Array.from(this._familyTree.families(node));
            if (families.length === 2) {
                for (var child of families[0].children)
                    max = Math.max(max, rotations.get(child));
                for (var child of families[1].children)
                    min = Math.min(min, rotations.get(child));
            } else {
                for (var child of node.children) {
                    min = Math.min(min, rotations.get(child));
                    max = Math.max(max, rotations.get(child));
                }
            }
            rotations.set(node, (min + max) / 2);
        }

        /**
         * @param {!app.Person} node
         * @param {!Array<!app.Person>} leafs
         */
        function populateLeafNodes(node, leafs) {
            if (!node.children.size) {
                leafs.push(node);
                return;
            }
            for (var family of this._familyTree.families(node)) {
                var children = Array.from(family.children);
                children.sort(childComparator.bind(this));
                for (var child of children)
                    populateLeafNodes.call(this, child, leafs);
            }
        }

        /**
         * @param {!app.Person} a
         * @param {!app.Person} b
         * @return {number}
         */
        function childComparator(a, b) {
            return this._subtreeSize.get(a) - this._subtreeSize.get(b);
        }

        /**
         * @param {!app.Person} node
         * @return {number}
         */
        function minAngleForNode(node) {
            var radius = this._nodeDepth.get(node) * this._depthRadiusStep();
            var peopleCount = 1 + node.partners.size;
            return g.segmentLengthToRad(radius, peopleCount * this._nodeRadius * 3);
        }
    }

    /**
     * @param {!app.FamilyTree} FamilyTree
     */
    _initializeSubtreeSizesAndDepths() {
        this._nodeDepth.clear();
        this._subtreeSize.clear();
        this._subtreeDepth.clear();
        dfs.call(this, this._familyTree.root(), 0);
        this._familyTreeDepth = this._subtreeDepth.get(this._familyTree.root());

        /**
         * @param {!app.Person} node
         * @param {number} depth
         */
        function dfs(node, depth) {
            var subtreeSize = 1;
            var subtreeDepth = 1;
            for (var child of node.children) {
                dfs.call(this, child, depth + 1);
                subtreeDepth = Math.max(subtreeDepth, 1 + this._subtreeDepth.get(child));
                subtreeSize += this._subtreeSize.get(child);
            }
            this._subtreeDepth.set(node, subtreeDepth);
            this._subtreeSize.set(node, subtreeSize);
            this._nodeDepth.set(node, depth);
        }
    }
}

