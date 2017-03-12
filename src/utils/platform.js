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

    get size() {
        var result = 0;
        for (var value of this._map.values())
            result += value.size;
        return result;
    }

    keysArray() {
        return Array.from(this._map.keys());
    }
}

Set.prototype.deleteAll = function(other) {
    for (var e of other)
        this.delete(e);
}

Set.prototype.first = function() {
    return this.values().next().value || null;
}

Promise.prototype.catchError = function(defaultValue) {
    return this.catch(error => {
        console.error(error);
        return defaultValue;
    });
}

/**
 * @param {string} nodeName
 * @param {string} className
 * @return {!Element}
 */
function createElementWithClass(nodeName, className) {
    var elem = document.createElement(nodeName);
    elem.className = className || '';
    return elem;
}

/**
 * @param {string} nodeName
 * @param {string} className
 * @return {!Element}
 */
Element.prototype.createChild = function(nodeName, className) {
    var elem = createElementWithClass(nodeName, className);
    this.appendChild(elem);
    return elem;
}

class EventEmitter {
    constructor() {
        this._eventListeners = new Multimap();
    }

    addListener(eventType, handler) {
        this._eventListeners.set(eventType, handler);
    }

    removeListener(eventType, handler) {
        this._eventListeners.delete(eventType, handler);
    }

    dispatch(eventType, data) {
        var handlers = Array.from(this._eventListeners.get(eventType));
        for (var handler of handlers)
            handler.call(null, data);
    }
}

function getLocalStorage() {
  var testKey = 'test', storage = window.localStorage;
  if (!storage)
    return null;
  try {
    storage.setItem(testKey, '1');
    storage.removeItem(testKey);
    return window.localStorage;
  } catch (error) {
    return null
  }
}
