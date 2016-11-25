app.CanvasRenderer = class {
    /**
     * @param {number} width
     * @param {number} height
     */
    constructor(width, height) {
        this._createHiDPICanvas();
        this.setSize(width, height);
        this._scale = 1
        this._fontSize = 16;
        this._rotation = 0;
        this._center = new g.Vec(0, 0);
    }

    _createHiDPICanvas() {
        this._canvas = document.createElement("canvas");
        this._context = this._canvas.getContext('2d');
        var devicePixelRatio = window.devicePixelRatio || 1;
        var backingStorePixelRatio = this._context.webkitBackingStorePixelRatio ||
                this._context.mozBackingStorePixelRatio ||
                this._context.msBackingStorePixelRatio ||
                this._context.oBackingStorePixelRatio ||
                this._context.backingStorePixelRatio || 1;
        this._ratio = devicePixelRatio / backingStorePixelRatio;
        this._context.setTransform(this._ratio, 0, 0, this._ratio, 0, 0);
    }

    /**
     * @return {!Element}
     */
    canvasElement() {
        return this._canvas;
    }

    /**
     * @param {number} width
     * @param {number} height
     */
    setSize(width, height) {
        this._width = width * this._ratio;
        this._height = height * this._ratio;
        this._canvas.width = this._width;
        this._canvas.height = this._height;
        this._canvas.style.width = width + "px";
        this._canvas.style.height = height + "px";
    }

    /**
     * @param {number} scale
     */
    setScale(scale) {
        this._scale = scale;
    }

    /**
     * @return {number}
     */
    scale() {
        return this._scale;
    }

    /**
     * @param {number} rotation
     */
    setRotation(rotation) {
        this._rotation = rotation;
    }

    /**
     * @return {number}
     */
    rotation() {
        return this._rotation;
    }

    /**
     * @param {!g.Vec} center
     */
    setCenter(center) {
        this._center = center;
    }

    /**
     * @return {!g.Vec}
     */
    center() {
        return this._center;
    }

    /**
     * @param {number} fontSize
     */
    setFontSize(fontSize) {
        this._fontSize = fontSize;
    }

    /**
     * @return {number}
     */
    fontSize() {
        return this._fontSize;
    }

    /**
     * @param {!app.Layout} layout
     */
    render(layout) {
        this._context.save();
        this._context.clearRect(0, 0, this._width, this._height);
        this._context.translate(this._width / 2, this._height / 2);
        this._context.rotate(this._rotation);
        this._context.scale(this._scale, this._scale);
        this._renderScaffolding(this._context, layout.scaffolding);
        for (var person of layout.positions.keys())
            this._renderPerson(this._context, layout, person);
        this._context.restore();
    }

    _font() {
        return this._fontSize + 'px Arial';
    }

    /**
     * @param {!CanvasRenderingContext2D} ctx
     * @param {!app.Layout} layout
     */
    _renderScaffolding(ctx, scaffolding) {
        ctx.beginPath();
        for (var shape of scaffolding) {
            if (shape instanceof g.Line) {
                var line = /** @type {!g.Line} */(shape);
                ctx.moveTo(line.from.x, line.from.y);
                ctx.lineTo(line.to.x, line.to.y);
            } else if (shape instanceof g.Arc) {
                var arc = /** @type {!g.Arc} */(shape);
                ctx.moveTo(arc.from.x, arc.from.y);
                ctx.arc(arc.center.x, arc.center.y, arc.r, arc.fromAngle, arc.toAngle, false);
            } else if (shape instanceof g.Bezier) {
                var bezier = /** @type {!g.Bezier} */(shape);
                ctx.moveTo(bezier.from.x, bezier.from.y);
                ctx.quadraticCurveTo(bezier.cp.x, bezier.cp.y, bezier.to.x, bezier.to.y);
            }
        }
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'darkgray';
        ctx.stroke();
    }

    /**
     * @param {!CanvasRenderingContext2D} ctx
     * @param {!app.Layout} layout
     * @param {!app.Person} person
     */
    _renderPerson(ctx, layout, person) {
        var position = layout.positions.get(person);
        var personRadius = layout.personRadius;

        ctx.beginPath();
        ctx.moveTo(position.x + personRadius, position.y);
        ctx.arc(position.x, position.y, personRadius, 0, 2*Math.PI);
        var color = 'gray';
        if (person.gender === app.Gender.Male)
            color = '#8eb2bd';
        else if (person.gender === app.Gender.Female)
            color = '#e89096';
        if (person.children.size) {
            ctx.fillStyle = color;
            ctx.fill();
        } else {
            ctx.fillStyle = "white";
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = color;
            ctx.stroke();
        }

        var rotation = g.normalizeRad(layout.rotations.get(person));
        var cumulativeRotation = g.normalizeRad(rotation + this._rotation);
        var textOnLeft = cumulativeRotation > Math.PI / 2 && cumulativeRotation < 3 * Math.PI / 2;
        if (textOnLeft)
            rotation -= Math.PI;

        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(rotation);
        ctx.font = this._font();
        ctx.fillStyle = color;
        ctx.textBaseline = 'bottom';
        if (textOnLeft) {
            var textWidth = ctx.measureText(person.fullName()).width;
            ctx.fillText(person.fullName(), -personRadius - 3 - textWidth, 0);
            ctx.textBaseline = 'top';
            textWidth = ctx.measureText(person.dates()).width;
            ctx.fillText(person.dates(), -personRadius - 3 - textWidth, 0);
        } else {
            ctx.fillText(person.fullName(), personRadius + 3, 0);
            ctx.textBaseline = 'top';
            ctx.fillText(person.dates(), personRadius + 3, 0);
        }
        ctx.restore();
    }
}

app.RenderLoop = class {
    /**
     * @param {!app.Renderer} renderer
     * @param {!app.LayoutEngine} layoutEngine
     */
    constructor(renderer, layoutEngine) {
        this._layoutEngine = layoutEngine;
        this._renderer = renderer;
        this._renderLoopBound = this._renderLoop.bind(this);

        // First render must be forced.
        this._invalidated = true;
        requestAnimationFrame(this._renderLoopBound);
    }

    _renderLoop() {
        if (this._invalidated || this._layoutEngine.isDirty()) {
            this._renderer.render(this._layoutEngine.layout());
            this._invalidated = false;
        }
        requestAnimationFrame(this._renderLoopBound);
    }

    invalidate() {
        this._invalidated = true;
    }
}
