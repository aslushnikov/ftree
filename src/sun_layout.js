app.Layout = class {
    /**
     * @return {!Array<!Object>}
     */
    scaffolding() { }

    /**
     * @return {!Array<!app.Person>}
     */
    people() { }

    /**
     * @param {!app.Person} person
     * @return {!g.Vec}
     */
    personPosition(person) { }

    /**
     * @param {!app.Person} person
     * @return {number}
     */
    personRadius(person) { }
}

app.SunLayout = class extends app.Layout {
    /**
     * @param {!app.FamilyTree} familyTree
     * @param {number} nodeRadius
     * @param {number} depthStep
     */
    constructor(familyTree, nodeRadius, depthStep) {
        super();
        this._depthRadiusStep = depthStep;
        this._nodeRadius = nodeRadius;
        this._positions = new Map();
        this._scaffolding = [];

        this._angles = new Map();

        this._computeSubtreeSizesAndDepth(familyTree);
        this._computeRadialPositions(familyTree);
        this._doLayout(familyTree);
    }

    _doLayout(familyTree) {
        var root = familyTree.root();
        this._positions.set(root, new g.Vec(0, 0));
        position.call(this, root, 0, Math.PI * 2);

        function position(node) {
            var children = node.children;
            if (!children.size)
                return;
            var r = (node[app.SunLayout._depth] + 1) * this._depthRadiusStep;
            var min = Infinity;
            var max = -Infinity;
            for (var child of children) {
                var angle = this._angles.get(child);
                this._positions.set(child, g.Vec.fromRadial(r, angle));
                min = Math.min(min, angle);
                max = Math.max(max, angle);
                position.call(this, child);
            }
            this._scaffolding.push(new g.Arc(g.zeroVec, r, min, max));
            // Level join.
            var joinStart = this._positions.get(node);
            var joinEnd = g.Vec.fromRadial(1, this._angles.get(node)).scale(r);
            this._scaffolding.push(new g.Line(joinStart, joinEnd));
        }
    }

    _computeSubtreeSizesAndDepth(familyTree) {
        this._maxDepth = dfs.call(this, familyTree.root(), 0);

        /**
         * @param {!app.Person} node
         * @param {number} depth
         * @return {number}
         */
        function dfs(node, depth) {
            var subtreeSize = 1;
            var maxDepth = 1;
            for (var child of node.children) {
                maxDepth = Math.max(maxDepth, 1 + dfs.call(this, child, depth + 1));
                subtreeSize += child[app.SunLayout._subtreeSize];
            }
            node[app.SunLayout._depth] = depth;
            node[app.SunLayout._subtreeSize] = subtreeSize;
            return maxDepth;
        }
    }

    /**
     * @param {!app.FamilyTree} familyTree
     */
    _computeRadialPositions(familyTree) {
        var leafs = [];
        populateLeafNodes(familyTree.root(), leafs);

        // assign initial positions to leafs.
        var minAngleForDepth = new Array(this._maxDepth);
        for (var i = 0; i < minAngleForDepth.length; ++i)
            minAngleForDepth[i] = g.segmentLengthToRad(i * this._depthRadiusStep, this._nodeRadius * 3);
        var required = 0;
        for (var i = 1; i < leafs.length; ++i)
            required += minAngleForDepth[leafs[i][app.SunLayout._depth]];
        var total = 2 * Math.PI;
        var free = total - required;
        var freeQuant = free / leafs.length;

        this._angles.set(leafs[0], 0);
        var last = 0;
        for (var i = 1; i < leafs.length; ++i) {
            var prevLeaf = leafs[i - 1];
            var leaf = leafs[i];
            var value = last + minAngleForDepth[prevLeaf[app.SunLayout._depth]] + freeQuant;
            this._angles.set(leaf, value);
            last = value;
        }
        layoutTree.call(this, familyTree.root());

        /**
         * @param {!app.Person] node
         */
        function layoutTree(node) {
            if (this._angles.has(node))
                return;
            var children = Array.from(node.children);
            var min = Infinity;
            var max = -Infinity;
            for (var child of children) {
                layoutTree.call(this, child);
                min = Math.min(min, this._angles.get(child));
                max = Math.max(max, this._angles.get(child));
            }
            this._angles.set(node, (min + max) / 2);
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
            children.sort(childComparator);
            for (var child of children)
                populateLeafNodes(child, leafs);
        }

        /**
         * @param {!app.Person} a
         * @param {!app.Person} b
         * @return {number}
         */
        function childComparator(a, b) {
            return a[app.SunLayout._subtreeSize] - b[app.SunLayout._subtreeSize];
        }
    }

    /**
     * @override
     * @return {!Array<!Object>}
     */
    scaffolding() {
        return this._scaffolding;
    }

    /**
     * @return {!Set<!app.Person>}
     */
    people() {
        return new Set(this._positions.keys());
    }

    /**
     * @param {!app.Person} person
     * @return {?g.Vec}
     */
    personPosition(person) {
        return this._positions.get(person) || null;
    }

    /**
     * @param {!app.Person} person
     * @return {number}
     */
    personRadius(person) {
        return this._nodeRadius;
    }
}

app.SunLayout._depth = Symbol('depth');
app.SunLayout._subtreeSize = Symbol('subtreeSize');
