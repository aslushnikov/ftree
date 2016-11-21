class Multimap {
    constructor() {
        this._map = new Map();
    }

    set(key, value) {
        var set = this._map.get(key);
        if (!set) {
            set = new Set();
            this._map.set(key, set);
        }
        set.add(value);
    }

    has(key, value) {
        if (!this._map.has(key))
            return false;
        return this._map.get(key).has(value);
    }

    delete(key, value) {
        var set = this._map.get(key);
        if (!set)
            return;
        set.delete(value);
        if (!value.size)
            this._map.delete(key);
    }

    get(key) {
        if (!this._map.has(key))
            return new Set();
        return this._map.get(key);
    }
}

Promise.prototype.catchError = function(defaultValue) {
    return this.catch(error => {
        console.error(error);
        return defaultValue;
    });
}
