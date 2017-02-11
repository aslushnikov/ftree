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

        for (var person of this._layout.positions.keys())
            this._renderPerson(this._container, this._layout, person);
    }

    _renderPersonCircle(position, radius, isRoot, gender, isChild, isDeceased) {
        var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', position.x);
        circle.setAttribute('cy', position.y);
        circle.setAttribute('r', radius);

        var color = 'gray';
        var alpha = isDeceased ? 0.5 : 1;
        if (isRoot)
            color = `rgba(231, 174, 68, ${alpha})`;
        else if (gender === app.Gender.Male)
            color = `rgba(142, 178, 189, ${alpha})`;
        else if (gender === app.Gender.Female)
            color = `rgba(232, 144, 150, ${alpha})`;

        if (isChild) {
            circle.setAttribute('stroke', color);
            circle.setAttribute('stroke-width', Math.ceil(0.146 * radius));
            circle.setAttribute('fill', 'none');
        } else {
            circle.setAttribute('stroke', 'none');
            circle.setAttribute('fill', color);
        }
        return circle;
    }

    /**
     * @param {!Element} container
     * @param {!app.Layout} layout
     * @param {!app.Person} person
     */
    _renderPerson(container, layout, person) {
        var position = layout.positions.get(person);
        var personRadius = layout.personRadius;

        var circle = this._renderPersonCircle(position, personRadius, person === layout.root, person.gender, person.isChild(), person.deceased);
        container.appendChild(circle);

    /*
        var rotation = g.normalizeRad(layout.rotations.get(person));
        var cumulativeRotation = g.normalizeRad(rotation);
        var textOnLeft = cumulativeRotation > Math.PI / 2 && cumulativeRotation < 3 * Math.PI / 2;
        if (textOnLeft)
            rotation -= Math.PI;

        ctx.save();
        ctx.translate(position.x, position.y);
        var color = `rgba(48, 48, 48, ${person.deceased ? 0.5 : 1}`;
        var textPadding = 6;
        if (person === layout.root) {
            var fullName = this._prerenderText(person.fullName(), color, this._fontName, this._nameFontSize * this._rootFontScale);
            var dates = this._prerenderText(person.dates(), color, this._fontName, this._datesFontSize * this._rootFontScale);
            this._drawImage(ctx, fullName, -fullName.width / 2, personRadius);
            this._drawImage(ctx, dates, -dates.width / 2, personRadius + fullName.height);
        } else {
            ctx.rotate(rotation);
            var fullName = this._prerenderText(person.fullName(), color, this._fontName, this._nameFontSize);
            var dates = this._prerenderText(person.dates(), color, this._fontName, this._datesFontSize);
            if (textOnLeft) {
                var textWidth = fullName.width;
                this._drawImage(ctx, fullName, -personRadius - textPadding - textWidth, -fullName.height);
                textWidth = dates ? dates.width : 0;
                this._drawImage(ctx, dates, -personRadius - textPadding - textWidth, 0);
            } else {
                this._drawImage(ctx, fullName, personRadius + textPadding, -fullName.height);
                this._drawImage(ctx, dates, personRadius + textPadding, 0);
            }
        }
        ctx.restore();
        */
    }

    createPersonIcon(size, gender, isChild, isDeceased) {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', size + 2);
        svg.setAttribute('height', size + 2);
        var radius = size / 2;
        svg.appendChild(this._renderPersonCircle(new g.Vec(radius+1, radius+1), radius, false, gender, isChild, isDeceased));
        return svg;
    }
}
