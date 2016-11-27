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
     * @return {string}
     */
    fullName() {
        if (!this.firstName || !this.lastName)
            return this.firstName || this.lastName;
        return this.firstName.trim() + ' ' + this.lastName.trim();
    }

    /**
     * @return {string}
     */
    dates() {
        if (this.birthYear && this.deathYear)
            return this.birthYear + ' - ' + this.deathYear;
        if (this.birthYear)
            return 'b.' + this.birthYear;
        if (this.deathYear)
            return 'd.' + this.deathYear;
        return '';
    }

    /**
     * @return {string}
     */
    toString() {
        return [this.firstName, this.lastName, this.birthYear].filter(x => !!x).join(' ');
    }
}

app.Family = class {
    constructor(parentFamily, main, alt, children) {
        this.parentFamily = parentFamily;
        this.main = main;
        this.alt = alt;
        this.children = children;
    }
}

app.FamilyTree = class {
    /**
     * @param {!app.Person} root
     */
    constructor(root) {
        this._root = root;
        this._families = new Multimap();
        // Just breadth-first search.
        var queue = [root];
        var parentFamilies = [null];
        var wp = 0;
        while (wp < queue.length) {
            var parentFamily = parentFamilies[wp];
            var node = queue[wp++];
            var unattributedChildren = new Set(node.children);
            for (var partner of node.partners) {
                addFamily.call(this, parentFamily, node, partner, partner.children);
                unattributedChildren.deleteAll(partner.children);
            }
            // These are children from unknown partner(s).
            if (unattributedChildren.size || !node.partners.size)
                addFamily.call(this, parentFamily, node, null, unattributedChildren);
        }

        function addFamily(parentFamily, main, alt, children) {
            var family = new app.Family(parentFamily, main, alt, children);
            for (var child of children) {
                queue.push(child);
                parentFamilies.push(family);
            }
            this._families.set(main, family);
            if (alt)
                this._families.set(alt, family);
        }
    }

    /**
     * @return {!Set<!app.Family>}
     */
    families(person) {
        return this._families.get(person);
    }

    /**
     * @param {!app.Person} person
     * @return {boolean}
     */
    isFamilyMain(person) {
        return this._families.get(person).first().main === person;
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
        return this._families.keysArray().length;
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

