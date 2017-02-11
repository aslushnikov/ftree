app.SVGRenderer = class extends app.Renderer {
    /**
     * @param {number} width
     * @param {number} height
     */
    constructor(width, height) {
        super();
        this._element = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this._container = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this._element.appendChild(this._container);
        this._scale = 1;
        this._offset = new g.Vec(0, 0);
        this._layout = null;
        this._isDirty = false;
        this.setSize(width, height);
    }

    /**
     * @override
     * @return {!Element}
     */
    element() {
        return this._element;
    }

    /**
     * @override
     * @param {number} width
     * @param {number} height
     */
    setSize(width, height) {
        if (g.eq(width, this._width) && g.eq(height, this._height))
            return;
        this._width = width;
        this._height = height;
        this._element.setAttribute('width', width + 'px');
        this._element.setAttribute('height', height + 'px');
        this._setTransformAttribute();
    }

    /**
     * @override
     * @return {{width: number, height: number}}
     */
    size() {
        return {width: this._width, height: this._height};
    }

    /**
     * @param {number} scale
     */
    setScale(scale) {
        this._scale = scale;
        this._setTransformAttribute();
    }

    /**
     * @override
     * @return {number}
     */
    scale() {
        return this._scale;
    }

    /**
     * @override
     * @param {!g.Vec} offset
     */
    setOffset(offset) {
        this._offset = offset;
        this._setTransformAttribute();
    }

    /**
     * @override
     * @return {!g.Vec}
     */
    offset() {
        return this._offset;
    }

    _setTransformAttribute() {
        var value = 'translate(' + (this._width/2) + ', ' + (this._height/2) + ') ';
        value += 'translate(' + this._offset.x + ', ' + this._offset.y + ') ';
        value += 'scale(' + this._scale + ', ' + this._scale + ') ';
        this._container.setAttribute('transform', value);
    }

    /**
     * @param {!app.Layout} layout
     */
    setLayout(layout) {
        if (this._layout === layout)
            return;
        this._layout = layout;
        this._isDirty = true;
    }

    /**
     * @override
     */
    render() {
        if (!this._isDirty)
            return;
        this._isDirty = false;
        if (this._container)
            this._container.remove();
        this._container = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this._element.appendChild(this._container);
        this._setTransformAttribute();

        for (var person of this._layout.positions.keys()) {
            var position = this._layout.positions.get(person);
            var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', position.x);
            circle.setAttribute('cy', position.y);
            circle.setAttribute('r', this._layout.personRadius);
            this._container.appendChild(circle);
        }
    }

    createPersonIcon(size, gender, isChild, isDeceased) {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', size);
        svg.setAttribute('height', size);
        var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', size / 2);
        circle.setAttribute('cy', size / 2);
        circle.setAttribute('r', size / 2);
        svg.appendChild(circle);
        return svg;
    }
}
