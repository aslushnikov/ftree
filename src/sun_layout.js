app.Layout = class {
    /**
     * @return {!Array<!Object>}
     */
    scaffolding() { }

    /**
     * @override
     * @return {!Map<!app.Person, !g.Vec>}
     */
    personPositions() { }
}

app.SunLayout = class extends app.Layout {
    constructor(familyTree, width, height) {
        super();
        this._familyTree = familyTree;
        this._width = width;
        this._height = height;

        this._scaffolding = [];

        this._levels = new Multimap();
    }

    /**
     * @override
     * @return {!Array<!Object>}
     */
    scaffolding() {
        return [
            new g.Line(new g.Vec(10, 10), new g.Vec(50, 50)),
            new g.Arc(new g.Vec(180, 80), 50, 0, Math.PI),
            new g.Bezier(new g.Vec(80, 100), new g.Vec(130, 150), new g.Vec(80, 150))
        ];
        return this._scaffolding;
    }

    /**
     * @override
     * @return {!Map<!app.Person, !g.Vec>}
     */
    personPositions() {
        return new Map();
    }
}
