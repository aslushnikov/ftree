app.Gender = {
    Male: Symbol('Male'),
    Female: Symbol('Female'),
    Other: Symbol('Other')
};

app.Person = class {
    /**
     * @param {string} firstName
     * @param {string} lastName
     * @param {!app.Gender} gender
     * @param {number} birthYear
     * @param {number} deathYear
     */
    constructor(firstName, lastName, gender, birthYear, deathYear) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.gender = gender;
        this.birthYear = birthYear;
        this.deathYear = deathYear;
        this.mother = null;
        this.father = null;
        this.partners = new Set();
        this.children = new Set();
    }

    /**
     * @return {!Array<!app.Person>}
     */
    selfAndDescendants() {
        // Just breadth-first search.
        var result = [this];
        var wp = 0;
        while (wp < result.length) {
            var node = result[wp++];
            for (var child of node.children)
                result.push(child);
        }
        return result;
    }

    /**
     * @return {string}
     */
    toString() {
        return [this.firstName, this.lastName, this.birthYear].filter(x => !!x).join(' ');
    }
}

app.FamilyTree = class {
    /**
     * @param {!app.Person} root
     */
    constructor(root) {
        this._root = root;
        this._layers = [];
    }

    /**
     * @return {!app.Person}
     */
    root() {
        return this._root;
    }

    /**
     * @return {number}
     */
    size() {
        if (!this._size)
            this._size = this._root.selfAndDescendants().length;
        return this._size;
    }

    /**
     * @param {!Array<!app.Person>} people
     * @return {?app.FamilyTree}
     */
    static fromPeople(people) {
        if (!people.length)
            return null;
        var trees = [];
        for (var person of people) {
            if (!person.mother && !person.father)
                trees.push(new app.FamilyTree(person));
        }
        var maxIndex = 0;
        var maxSize = trees[0].size();
        for (var i = 1; i < trees.length; ++i) {
            var size = trees[i].size();
            if (size > maxSize) {
                maxIndex = i;
                maxSize = size;
            }
        }
        return trees[maxIndex];
    }
}

