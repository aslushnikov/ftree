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
}

app.SunLayout = class extends app.Layout {
    /**
     * @param {!app.FamilyTree} familyTree
     */
    constructor(familyTree) {
        super();
        this._depthRadiusStep = 200;
        this._nodeRadius = 25;
        this._positions = new Map();
        this._scaffolding = [];

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
                var angle = child[app.SunLayout._angle];
                this._positions.set(child, g.Vec.fromRadial(r, angle));
                min = Math.min(min, angle);
                max = Math.max(max, angle);
                position.call(this, child);
            }
            this._scaffolding.push(new g.Arc(g.zeroVec, r, min, max));
            // Level join.
            var joinStart = this._positions.get(node);
            var joinEnd = g.Vec.fromRadial(1, node[app.SunLayout._angle]).scale(r);
            this._scaffolding.push(new g.Line(joinStart, joinEnd));
        }
    }

    _computeSubtreeSizesAndDepth(familyTree) {
        dfs.call(this, familyTree.root(), 0);

        /**
         * @param {!app.Person} node
         * @param {number} depth
         */
        function dfs(node, depth) {
            var subtreeSize = 1;
            for (var child of node.children) {
                dfs.call(this, child, depth + 1);
                subtreeSize += child[app.SunLayout._subtreeSize];
            }
            node[app.SunLayout._depth] = depth;
            node[app.SunLayout._subtreeSize] = subtreeSize;
        }
    }

    /**
     * @param {!app.FamilyTree} familyTree
     */
    _computeRadialPositions(familyTree) {
        var leafs = [];
        populateLeafNodes(familyTree.root(), leafs);

        // assign initial positions to leafs.
        var angleQuant = 2 * Math.PI / leafs.length;
        for (var i = 0; i < leafs.length; ++i) {
            var leaf = leafs[i];
            leaf[app.SunLayout._angle] = angleQuant * i;
        }
        layoutTree(familyTree.root());

        /**
         * @param {!app.Person] node
         */
        function layoutTree(node) {
            if (typeof node[app.SunLayout._angle] === 'number')
                return;
            var children = Array.from(node.children);
            var min = Infinity;
            var max = -Infinity;
            for (var child of children) {
                layoutTree(child);
                min = Math.min(min, child[app.SunLayout._angle]);
                max = Math.max(max, child[app.SunLayout._angle]);
            }
            node[app.SunLayout._angle] = (min + max) / 2;
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
}

app.SunLayout._depth = Symbol('depth');
app.SunLayout._subtreeSize = Symbol('subtreeSize');
app.SunLayout._angle = Symbol('angle');
