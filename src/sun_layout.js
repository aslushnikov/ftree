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
    personRotation(person) { }
}

app.SunLayout = class extends app.Layout {
    constructor(familyTree, width, height) {
        super();
        var size = new g.Vec(width, height);

        this._people = [familyTree.root()];

        this._scaffolding = [];
        var center = size.scale(0.5);
        var maxR = Math.min(width, height) / 2;
        var N = 100;
        for (var i = 0; i < N; ++i) {
            var r = (maxR / N) * (i + 1);
            var fromA = Math.PI / N * i;
            var toA = fromA + Math.PI * 3 / 2;
            this._scaffolding.push(new g.Arc(center, r, fromA, toA));
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
     * @return {!Array<!app.Person>}
     */
    people() {
        return this._people;
    }

    /**
     * @param {!app.Person} person
     * @return {?g.Vec}
     */
    personPosition(person) {
        return new g.Vec(200, 200);
    }

    /**
     * @param {!app.Person} person
     * @return {number}
     */
    personRotation(person) {
        return Math.PI / 3 + Math.PI;
    }
}
