app.SVGRenderer = class extends app.Renderer {
    /**
     * @param {number} width
     * @param {number} height
     */
    constructor(width, height) {
        super();
        this._element = this._createSVG('svg');
        this._scale = 1;
        this._offset = new g.Vec(0, 0);
        this._layout = null;
        this._isDirtyTransform = false;
        this._isDirtyLayout = false;
        this.setSize(width, height);
    }

    _createSVG(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
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
        this._isDirtyTransform = true;
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
        this._isDirtyTransform = true;
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
        this._isDirtyTransform = true;
    }

    setDebugCircle(enabled, x, y, r) {
        if (!enabled) {
            this._debugCircle = null;
            return;
        }
        this._debugCircle = {
            x: x,
            y: y,
            r: r
        };
        this._isDirtyLayout = true;
    }

    /**
     * @override
     * @return {!g.Vec}
     */
    offset() {
        return this._offset;
    }

    toLayoutCoordinates(rendererPoint) {
        return rendererPoint.subtract(this._offset).scale(1/this._scale);
    }

    toRenderCoordinates(layoutPoint) {
        // Convert from layout coordinates to the coordinates relative to the
        // center of SVG element.
        return layoutPoint.scale(this._scale).add(this._offset);
    }

    setDatesFormatter(formatter) {
        if (this._datesFormatter === formatter)
            return;
        this._datesFormatter = formatter;
        this._isDirtyLayout = true;
    }

    _setTransformAttribute() {
        if (!this._container)
            return;
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
        this._isDirtyLayout = true;
    }

    /**
     * @override
     */
    render() {
        if (this._isDirtyTransform && !this._isDirtyLayout) {
            this._isDirtyTransform = false;
            this._setTransformAttribute();
            return;
        }
        if (!this._isDirtyLayout)
            return;
        this._isDirtyLayout = false;
        this._isDirtyTransform = false;
        if (this._container)
            this._container.remove();
        this._container = this._createSVG('g');
        this._container.setAttribute('style', 'will-change:transform;');
        this._element.appendChild(this._container);
        this._setTransformAttribute();
        if (!this._layout)
            return;

        if (this._layout.backgroundImage) {
            var img = this._layout.backgroundImage;
            var image = this._createSVG('image');
            image.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href',img.image.src);
            image.setAttribute('x', img.topLeft.x);
            image.setAttribute('y', img.topLeft.y);
            image.setAttribute('width', img.image.width);
            image.setAttribute('height', img.image.height);
            if (img.image.src.indexOf('_2x.') !== -1)
                image.classList.add('hidpi-image');
            this._container.appendChild(image);
        }

        this._renderScaffolding(this._container, this._layout.scaffolding);

        var radius = this._layout.personRadius;
        for (var person of this._layout.positions.keys()) {
            var position = this._layout.positions.get(person);
            var rotation = this._layout.rotations.get(person);
            var isRoot = person === this._layout.root;
            this._container.appendChild(this._renderPerson(person, position, rotation, radius, isRoot));
        }

        if (this._debugCircle) {
            var circle = this._createSVG('circle');
            circle.setAttribute('r', this._debugCircle.r);
            circle.setAttribute('cx', this._debugCircle.x);
            circle.setAttribute('cy', this._debugCircle.y);
            this._container.appendChild(circle);
        }
    }

    /**
     * @param {!Element} container
     * @param {!app.Layout} layout
     */
    _renderScaffolding(container, scaffolding) {
        var path = '';
        for (var shape of scaffolding) {
            if (shape instanceof g.Line) {
                var line = /** @type {!g.Line} */(shape);
                path += ' M' + line.from.x + ' ' + line.from.y;
                path += ' L ' + line.to.x + ' ' + line.to.y;
            } else if (shape instanceof g.Arc) {
                var arc = /** @type {!g.Arc} */(shape);
                path += ' M' + arc.from.x + ' ' + arc.from.y;
                path += ' A ' + arc.r + ' ' + arc.r;
                var isLargeArc = g.normalizeRad(arc.toAngle - arc.fromAngle) > Math.PI;
                var component = isLargeArc ? ' 1 1' : ' 0 1';
                path += ' 0 ' + component;
                path += ' ' + arc.to.x + ' ' + arc.to.y;
            } else if (shape instanceof g.Bezier) {
                var bezier = /** @type {!g.Bezier} */(shape);
                path += ' M' + bezier.from.x + ' ' + bezier.from.y;
                path += ' Q ' + bezier.cp.x + ' ' + bezier.cp.y + ' ' + bezier.to.x + ' ' + bezier.to.y;
            }
        }

        var element = this._createSVG('path');
        element.classList.add('scaffolding');
        element.setAttribute('d', path);
        container.appendChild(element);
    }

    /**
     * @param {!app.Person} person
     * @return {!Element}
     */
    _renderPerson(person, position, rotation, personRadius, isRoot) {
        rotation = g.normalizeRad(rotation);
        var textOnLeft = rotation > Math.PI / 2 && rotation < 3 * Math.PI / 2;
        if (textOnLeft)
            rotation -= Math.PI;
        rotation = g.radToDeg(rotation);

        var group = this._createSVG('g');
        var transform = 'translate(' + position.x + ', ' + position.y + ') ';
        transform += 'rotate(' + rotation + ')';
        group.setAttribute('transform', transform);
        group.classList.add('person');
        if (person.deceased)
            group.classList.add('deceased');
        if (person.gender === app.Gender.Male)
            group.classList.add('sex-male');
        else if (person.gender === app.Gender.Female)
            group.classList.add('sex-female');
        else
            group.classList.add('sex-other');
        if (person.isChild())
            group.classList.add('infant');
        if (isRoot)
            group.classList.add('root');

        var circle = this._createSVG('circle');
        circle.setAttribute('r', personRadius);
        group.appendChild(circle);

        var datesText = this._datesFormatter(person);

        var fullName = this._createSVG('text');
        fullName.classList.add('name');
        fullName.textContent = person.fullName();
        if (!datesText && !person.children.size) {
            fullName.setAttribute('y', '0em');
            fullName.setAttribute('dominant-baseline', 'central');
        } else {
            fullName.setAttribute('y', '-0.35em');
        }
        group.appendChild(fullName);

        var dates = this._createSVG('text');

        if (datesText) {
            dates.setAttribute('dominant-baseline', 'text-before-edge');
            dates.classList.add('dates');
            dates.textContent = datesText;
            dates.setAttribute('y', 0);
            group.appendChild(dates);
        }

        var textPadding = 6;
        if (isRoot) {
            fullName.setAttribute('text-anchor', 'middle');
            fullName.setAttribute('x', 0);
            dates.setAttribute('text-anchor', 'middle');
            dates.setAttribute('x', 0);
        } else if (textOnLeft) {
            fullName.setAttribute('x', -personRadius - textPadding);
            fullName.setAttribute('text-anchor', 'end');
            dates.setAttribute('x', -personRadius - textPadding);
            dates.setAttribute('text-anchor', 'end');
        } else {
            fullName.setAttribute('x', personRadius + textPadding);
            dates.setAttribute('x', personRadius + textPadding);
        }
        return group;
    }

    createPersonIcon(size, gender, isChild, isDeceased) {
        var svg = this._createSVG('svg');
        svg.classList.add('legend');
        svg.setAttribute('width', size + 2);
        svg.setAttribute('height', size + 2);
        var radius = size / 2;
        var thisYear = new Date().getFullYear();
        var birthYear = isChild ? thisYear : 0;
        var deathYear = isDeceased ? thisYear : null;
        var person = new app.Person('', '', gender, birthYear, deathYear);
        person.deceased = isDeceased;
        svg.appendChild(this._renderPerson(person, new g.Vec(radius+1, radius+1), 0, radius, false));
        return svg;
    }
}
