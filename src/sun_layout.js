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
        this._precompute(familyTree);
        this._doLayout(familyTree);
    }

    _doLayout(familyTree) {
        var root = familyTree.root();
        this._positions.set(root, new g.Vec(0, 0));
        position.call(this, root, 0, Math.PI * 2);

        function position(node, arcFrom, arcTo) {
            var children = Array.from(node.children);
            if (!children.length)
                return;
            var r = (node[app.SunLayout._depth] + 1) * this._depthRadiusStep;
            var offset = g.segmentLengthToRad(r, this._nodeRadius);
            arcTo -= offset;
            children.sort(nodeComparator);
            var last = arcFrom;
            var childAngles = [];
            for (var i = 0; i < children.length; ++i) {
                var child = children[i];
                var childArcFrom = last;
                var childArcTo = last + child[app.SunLayout._minArc];
                last = childArcTo;

                var positionAngle = (childArcFrom + childArcTo) / 2;
                childAngles.push(positionAngle);
                this._positions.set(child, g.Vec.fromRadial(r, positionAngle));
                position.call(this, child, childArcFrom, childArcTo);
            }
            this._scaffolding.push(new g.Arc(g.zeroVec, r, childAngles[0], childAngles[childAngles.length - 1]));
            // Level join.
            var joinStart = this._positions.get(node);
            var joinEnd = joinStart;
            // corner case in case of very first node.
            if (joinStart.x === 0 && joinStart.y === 0)
                var joinEnd = g.Vec.fromRadial(r, Math.PI / 2 + Math.PI / 5);
            else
                var joinEnd = joinStart.scale(r / joinStart.len());
            this._scaffolding.push(new g.Line(joinStart, joinEnd));
        }

        /**
         * @param {!app.Person} a
         * @param {!app.Person} b
         * @return {number}
         */
        function nodeComparator(a, b) {
            var minArcDiff = a[app.SunLayout._minArc] - b[app.SunLayout._minArc];
            if (Math.abs(minArcDiff) < 1e-7)
                return a[app.SunLayout._subtreeSize] - b[app.SunLayout._subtreeSize];
            return minArcDiff;
        }
    }

    /**
     * @param {!Array<number>} depthChildCount
     * @return {number}
     */
    _minimumArc(depthChildCount) {
        var minArcSizes = [];
        for (var i = 1; i < depthChildCount.length; ++i) {
            var count = depthChildCount[i];
            var r = i * this._depthRadiusStep;
            var segment = 3 * count * this._nodeRadius; // Add padding between nodes.
            var arc = g.segmentLengthToRad(r, segment);
            minArcSizes.push(arc);
        }
        return Math.max(...minArcSizes);
    }

    /**
     * @param {!app.FamilyTree} familyTree
     */
    _precompute(familyTree) {
        var root = familyTree.root();
        // It's hard to imagine familyTree could be more then 30 levels deep.
        var maxDepth = 30;
        dfs.call(this, root, 0);

        /**
         * @param {!app.Person} node
         * @param {number} depth
         */
        function dfs(node, depth) {
            // It's hard to imagine there's more then 100 levels.
            var depthCount = new Array(maxDepth).fill(0);
            depthCount[depth] = 1;
            var subtreeSize = 1;
            for (var child of node.children) {
                dfs.call(this, child, depth + 1);
                var childDepthCounts = child[app.SunLayout._depthChildCount];
                for (var i = 0; i < maxDepth; ++i) {
                    depthCount[i] += childDepthCounts[i];
                    subtreeSize += childDepthCounts[i];
                }
            }

            node[app.SunLayout._depth] = depth;
            node[app.SunLayout._subtreeSize] = subtreeSize;
            node[app.SunLayout._depthChildCount] = depthCount;
            node[app.SunLayout._minArc] = this._minimumArc(depthCount);
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
app.SunLayout._minArc = Symbol('minArc');
app.SunLayout._depthChildCount = Symbol('depthChildCount');
