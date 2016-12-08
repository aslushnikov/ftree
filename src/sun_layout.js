app.Layout = class {
    /**
     * @param {?app.Person} root
     * @param {!Map<!app.Person, !g.Vec} positions
     * @param {!Map<!app.Person, number} rotations
     * @param {!Array<!Object>} scaffolding
     * @param {?g.Image} bgImage
     * @param {number} personRadius
     */
    constructor(root, positions, rotations, scaffolding, bgImage, personRadius) {
        this.root = root;
        this.positions = positions;
        this.rotations = rotations;
        this.scaffolding = scaffolding;
        this.backgroundImage = bgImage;
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
        return new app.Layout(null, new Map(), new Map(), [], null, 0);
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
        this._parentRatio = 1 / g.GOLDEN_RATIO;
        this._backgroundImage = null;

        this._levelSizeOffsets = new Map();
        this._cumulativeLevelOffsets = [];

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
     * @param {number} level
     * @param {number} offset
     */
    setLevelSizeOffset(level, offset) {
        this._isDirty = true;
        this._levelSizeOffsets.set(level, offset);
    }

    /**
     * @param {number} level
     * @return {number}
     */
    levelSizeOffset(level) {
        return this._levelSizeOffsets.get(level) || 0;
    }

    /**
     * @return {boolean}
     */
    isDirty() {
        return this._isDirty;
    }

    /**
     * @param {!HTMLImageElement} image
     */
    setBackgroundImage(image) {
        this._backgroundImage = image;
        this._isDirty = true;
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

    setParentRatio(parentRatio) {
        if (g.eq(parentRatio, this._parentRatio))
            return;
        this._parentRatio = parentRatio;
        this._isDirty = true;
    }

    parentRatio() {
        return this._parentRatio;
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
     * @param {number} level
     * @return {number}
     */
    _depthRadiusStep(level) {
        var defaultSize = (this._size - this._nodeRadius) / 2 / this._familyTreeDepth;
        return level * defaultSize + this._cumulativeLevelOffsets[level];
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

        var total = 0;
        for (var i = 0; i < this._familyTreeDepth; ++i) {
            total += this._levelSizeOffsets.get(i) || 0;
            this._cumulativeLevelOffsets.push(total);
        }

        var rotations = this._computeRotations();
        var positions = this._computePositions(rotations);
        var scaffolding = this._computeScaffolding(rotations, positions);
        var bgImage = this._backgroundImage ? new g.Image(new g.Vec(-this._backgroundImage.width / 2, -this._backgroundImage.height / 2), this._backgroundImage) : null;

        this._lastLayout = new app.Layout(this._familyTree.root(), positions, rotations, scaffolding, bgImage, this._nodeRadius);
        this.dispatch(app.LayoutEngine.Events.LayoutRecalculated);
        return this._lastLayout;
    }

    _computeScaffolding(rotations, positions) {
        var scaffolding = [];

        // Render family arcs.
        for (var node of rotations.keys()) {
            if (!this._familyTree.isFamilyMain(node))
                continue;
            var families = Array.from(this._familyTree.families(node));
            for (var family of families) {
                var familyR = this._depthRadiusStep(this._nodeDepth.get(family.main));
                if (family.alt) {
                    var rotation1 = rotations.get(family.main);
                    var rotation2 = rotations.get(family.alt);
                    scaffolding.push(new g.Arc(g.zeroVec, familyR, Math.min(rotation1, rotation2), Math.max(rotation1, rotation2)));
                }
                var children = family.children;
                if (!children.size)
                    continue;
                var r = this._depthRadiusStep(this._nodeDepth.get(node) + 1);
                var min = Infinity;
                var max = -Infinity;
                for (var child of children) {
                    var angle = rotations.get(child);
                    min = Math.min(min, angle);
                    max = Math.max(max, angle);
                }

                var familyMiddle = rotations.get(family.main);
                if (family.alt)
                    familyMiddle = (familyMiddle + rotations.get(family.alt)) / 2;
                if (g.eq(min, max) && families.length !== 2) {
                    // There is a sole child. Render a level join straight to it.
                    var joinStart = g.Vec.fromRadial(familyR, familyMiddle);
                    var joinEnd = g.Vec.fromRadial(r, familyMiddle);
                    scaffolding.push(new g.Line(joinStart, joinEnd));
                    continue;
                }

                var offset = this._nodeRadius * 2;

                var tip1 = 1;
                var tip2 = 1;
                if (familyMiddle > max) {
                    tip2 = -1;
                    max = familyMiddle;
                } else if (familyMiddle < min) {
                    tip1 = -1;
                    min = familyMiddle;
                }
                var [end1, end2] = curvyArc.call(this, r - offset, min, max, tip1, tip2);

                // Level join.
                var joinStart = g.Vec.fromRadial(familyR, familyMiddle);
                var joinEnd = g.Vec.fromRadial(r - offset, familyMiddle);
                if (tip1 === -1)
                    joinEnd = end1;
                else if (tip2 === -1)
                    joinEnd = end2;
                scaffolding.push(new g.Line(joinStart, joinEnd));

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
        }
        return scaffolding;

        function curvyArc(r, from, to, curvyTip1, curvyTip2) {
            r = Math.max(r, 0);
            var totalArcLength = g.segmentRadToLength(r, to - from);
            var maxCurveRadius = this._nodeRadius;
            var curveRadius = Math.min(totalArcLength / 2, maxCurveRadius);
            var curveOffsetRad = g.segmentLengthToRad(r, curveRadius);

            var start1 = g.Vec.fromRadial(r, min + curveOffsetRad);
            var start2 = g.Vec.fromRadial(r, max - curveOffsetRad);
            var end1 = g.Vec.fromRadial(r + curveRadius * curvyTip1, min);
            var end2 = g.Vec.fromRadial(r + curveRadius * curvyTip2, max);
            var cp1 = g.Vec.fromRadial(r, min);
            var cp2 = g.Vec.fromRadial(r, max);
            scaffolding.push(new g.Arc(g.zeroVec, r, min + curveOffsetRad, max - curveOffsetRad));
            scaffolding.push(new g.Bezier(start1, end1, cp1));
            scaffolding.push(new g.Bezier(start2, end2, cp2));
            return [end1, end2];
        }
    }

    /**
     * @param {!Map<!app.Person, number>} rotations
     * @return {!Map<!app.Person, !g.Vec>}
     */
    _computePositions(rotations) {
        var positions = new Map();
        positions.set(this._familyTree.root(), new g.Vec(0, 0));
        for (var node of rotations.keys()) {
            var r = this._depthRadiusStep(this._nodeDepth.get(node));
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
        var root = this._familyTree.root();
        populateLeafNodes.call(this, root, leafs);

        var leafCount = new Map();
        computeLeafCount.call(this, root, leafCount);
        var deficitPerLeaf = new Map();
        computeDeficitPerLeaf.call(this, leafCount, root, deficitPerLeaf);
        var maxDeficit = new Map();
        computeMaxDeficit.call(this, deficitPerLeaf, root, maxDeficit, 0);

        // assign initial positions to leafs.
        var required = 0;
        for (var i = 0; i < leafs.length; ++i)
            required += familyRequiredRad.call(this, leafs[i]) + maxDeficit.get(leafs[i]);
        var total = 2 * Math.PI + this._overlap;
        var free = total - required;
        var freeQuant = free / leafs.length;

        var last = this._initialRotation;
        setNodeRotations.call(this, leafs[0], last);
        for (var i = 0; i < leafs.length; ++i) {
            var leaf = leafs[i];
            var value = familyRequiredRad.call(this, leaf) + freeQuant 
                + maxDeficit.get(leaf);
            setNodeRotations.call(this, leaf, last + value/2);
            last = last + value;
        }
        layoutTree.call(this, this._familyTree.root());
        // Override the root node to make it beautiful.
        setNodeRotations.call(this, root, 0);
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
            setNodeRotations.call(this, node, min + (max - min) * this._parentRatio);
        }

        function setNodeRotations(node, nodeRotation) {
            var families = Array.from(this._familyTree.families(node));
            var span = familyRequiredRad.call(this, node);
            if (families.length === 1) {
                if (families[0].alt) {
                    // We want to show males over females.
                    var top = nodeRotation + span / 4;
                    var bottom = nodeRotation - span / 4;
                    if (Math.sin(top) > Math.sin(bottom)) {
                        var tmp = top;
                        top = bottom;
                        bottom = tmp;
                    }
                    rotations.set(families[0].man(), top);
                    rotations.set(families[0].woman(), bottom);
                } else {
                    rotations.set(families[0].main, nodeRotation);
                }
            } else {
                rotations.set(node, nodeRotation);
                if (families[0].alt)
                    rotations.set(families[0].alt, nodeRotation - span / 3);
                if (families[1].alt)
                    rotations.set(families[1].alt, nodeRotation + span / 3);
            }
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

        function computeLeafCount(node, leafCount) {
            if (!node.children.size) {
                leafCount.set(node, 1);
                return 1;
            }
            var count = 0;
            for (var child of node.children)
                count += computeLeafCount.call(this, child, leafCount);
            leafCount.set(node, count);
            return count;
        }

        function computeDeficitPerLeaf(leafCount, node, deficitPerLeaf) {
            if (!node.children.size) {
                deficitPerLeaf.set(node, 0);
                return familyRequiredRad.call(this, node);
            }
            var totalAvailable = 0;
            for (var child of node.children)
                totalAvailable += computeDeficitPerLeaf.call(this, leafCount, child, deficitPerLeaf);
            var deficit = Math.min(totalAvailable - familyRequiredRad.call(this, node), 0);
            deficitPerLeaf.set(node, Math.abs(deficit) / leafCount.get(node))
            return totalAvailable;
        }

        function computeMaxDeficit(deficitPerLeaf, node, maxDeficit, currentMaximum) {
            currentMaximum = Math.max(currentMaximum, deficitPerLeaf.get(node));
            maxDeficit.set(node, currentMaximum);
            for (var child of node.children)
                computeMaxDeficit.call(this, deficitPerLeaf, child, maxDeficit, currentMaximum);
        }

        /**
         * @param {!app.Person} node
         * @return {number}
         */
        function familyRequiredRad(node) {
            var depth = this._nodeDepth.get(node);
            if (!depth)
                return 0;
            var radius = this._depthRadiusStep(depth);
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
            for (var partner of node.partners) {
                this._nodeDepth.set(partner, depth);
                this._subtreeDepth.set(partner, subtreeDepth);
                this._subtreeSize.set(partner, subtreeSize);
            }
        }
    }
}

