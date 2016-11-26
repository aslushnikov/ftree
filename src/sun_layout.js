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
        if (Math.abs(radius - this._nodeRadius) < app.SunLayout.EPS)
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
        if (Math.abs(rotation - this._initialRotation) < app.SunLayout.EPS)
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
        if (Math.abs(size - this._size) < app.SunLayout.EPS)
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
        if (Math.abs(overlap - this._overlap) < app.SunLayout.EPS)
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
        var positions = new Map();
        var scaffolding = [];
        positions.set(this._familyTree.root(), new g.Vec(0, 0));
        position.call(this, this._familyTree.root(), 0, Math.PI * 2);
        this._lastLayout = new app.Layout(positions, rotations, scaffolding, this._nodeRadius);
        this.dispatch(app.LayoutEngine.Events.LayoutRecalculated);
        return this._lastLayout;

        function position(node) {
            var children = node.children;
            if (!children.size)
                return;
            var r = (this._nodeDepth.get(node) + 1) * this._depthRadiusStep();
            var min = Infinity;
            var max = -Infinity;
            for (var child of children) {
                var angle = rotations.get(child);
                positions.set(child, g.Vec.fromRadial(r, angle));
                min = Math.min(min, angle);
                max = Math.max(max, angle);
                position.call(this, child);
            }
            scaffolding.push(new g.Arc(g.zeroVec, r, min, max));
            // Level join.
            var joinStart = positions.get(node);
            var joinEnd = g.Vec.fromRadial(1, rotations.get(node)).scale(r);
            scaffolding.push(new g.Line(joinStart, joinEnd));
        }
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
        var minAngleForDepth = new Array(this._familyTreeDepth);
        for (var i = 0; i < minAngleForDepth.length; ++i)
            minAngleForDepth[i] = g.segmentLengthToRad(i * this._depthRadiusStep(), this._nodeRadius * 3);
        var required = 0;
        for (var i = 1; i < leafs.length; ++i)
            required += minAngleForDepth[this._nodeDepth.get(leafs[i])];
        var total = 2 * Math.PI + this._overlap;
        var free = total - required;
        var freeQuant = free / leafs.length;

        var last = this._initialRotation;
        rotations.set(leafs[0], last);
        for (var i = 1; i < leafs.length; ++i) {
            var prevLeaf = leafs[i - 1];
            var leaf = leafs[i];
            var value = last + minAngleForDepth[this._nodeDepth.get(prevLeaf)] + freeQuant;
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
            var children = Array.from(node.children);
            var min = Infinity;
            var max = -Infinity;
            for (var child of children) {
                layoutTree.call(this, child);
                min = Math.min(min, rotations.get(child));
                max = Math.max(max, rotations.get(child));
            }
            rotations.set(node, (min + max) / 2);
        }

        /**
         * @param {!app.Person} node
         * @param {!Array<!app.Person>} leafs
         */
        function populateLeafNodes(node, leafs) {
            var children = Array.from(node.children);
            if (!children.length) {
                leafs.push(node);
                return;
            }
            children.sort(childComparator.bind(this));
            for (var child of children)
                populateLeafNodes.call(this, child, leafs);
        }

        /**
         * @param {!app.Person} a
         * @param {!app.Person} b
         * @return {number}
         */
        function childComparator(a, b) {
            return this._subtreeSize.get(a) - this._subtreeSize.get(b);
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

app.SunLayout.EPS = 1e-7;
