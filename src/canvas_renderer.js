app.CanvasRenderer = class {
    /**
     * @return {number}
     */
    static canvasRatio() {
        if (app.CanvasRenderer._canvasRatio)
            return app.CanvasRenderer._canvasRatio;
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        var devicePixelRatio = window.devicePixelRatio || 1;
        var backingStorePixelRatio = context.webkitBackingStorePixelRatio ||
                context.mozBackingStorePixelRatio ||
                context.msBackingStorePixelRatio ||
                context.oBackingStorePixelRatio ||
                context.backingStorePixelRatio || 1;
        app.CanvasRenderer._canvasRatio = devicePixelRatio / backingStorePixelRatio;
        return app.CanvasRenderer._canvasRatio;
    }

    /**
     * @return {!Element}
     */
    static createHiDPICanvas() {
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        var ratio = app.CanvasRenderer.canvasRatio();
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        return canvas;
    }

    /**
     * @param {!Element} canvas
     * @param {number} width
     * @param {number} height
     */
    static setCanvasSize(canvas, width, height) {
        var ratio = app.CanvasRenderer.canvasRatio();
        canvas.width = width * ratio;
        canvas.height = height * ratio;
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";
    }

    /**
     * @param {number} width
     * @param {number} height
     */
    constructor(width, height) {
        this._canvas = app.CanvasRenderer.createHiDPICanvas();
        this.setSize(width, height);
        this._scale = 1
        this._fontSize = 16;
        this._offset = new g.Vec(0, 0);

        /** @type {!Map<string, !Element>} */
        this._prerenderedText = new Map();
        /** @type {!Map<string, !TextMetrics>} */
        this._textMetrics = new Map();
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
        var ratio = app.CanvasRenderer.canvasRatio();
        this._width = width * ratio;
        this._height = height * ratio;
        app.CanvasRenderer.setCanvasSize(this._canvas, width, height);
    }

    size() {
        return {width: this._width, height: this._height};
    }

    /**
     * @param {number} scale
     * @param {!g.Vec} fixedPoint
     */
    setScale(scale, fixedPoint) {
        // Default fixed point is a canvas center - (0, 0).
        fixedPoint = fixedPoint || new g.Vec(0, 0);
        var oldOffset = this.offset();
        var oldScale = this._scale;

        var newOffset = fixedPoint.subtract(fixedPoint.subtract(oldOffset).scale(scale/oldScale))
        this._scale = scale;
        this.setOffset(newOffset);
    }

    /**
     * @return {number}
     */
    scale() {
        return this._scale;
    }

    /**
     * @param {!g.Vec} offset
     */
    setOffset(offset) {
        this._offset = offset.scale(app.CanvasRenderer.canvasRatio());
    }

    /**
     * @return {!g.Vec}
     */
    offset() {
        return this._offset.scale(1/app.CanvasRenderer.canvasRatio());
    }

    /**
     * @param {number} fontSize
     */
    setFontSize(fontSize) {
        this._textMetrics.clear();
        this._prerenderedText.clear();
        this._fontSize = fontSize;
    }

    /**
     * @return {number}
     */
    fontSize() {
        return this._fontSize;
    }

    /**
     * @param {string} text
     * @return {!Element}
     */
    _prerenderText(text, color) {
        var id = text + "$$" + color;
        var render = this._prerenderedText.get(id);
        if (render)
            return render;

        render = app.CanvasRenderer.createHiDPICanvas();
        var metrics = this._textMetrics.get(text);
        var ratio = app.CanvasRenderer.canvasRatio();
        app.CanvasRenderer.setCanvasSize(render, metrics.width / ratio, (this._fontSize + 5) / ratio);
        var ctx = render.getContext('2d');
        ctx.font = this._font();
        ctx.fillStyle = color;
        ctx.textBaseline = 'top';
        ctx.fillText(text, 0, 2);
        this._prerenderedText.set(id, render);
        return render;
    }

    /**
     * @param {!app.Layout} layout
     */
    render(layout) {
        var ctx = this._canvas.getContext('2d');
        ctx.save();
        ctx.clearRect(0, 0, this._width, this._height);

        ctx.translate(this._width / 2, this._height / 2);
        ctx.translate(this._offset.x, this._offset.y);
        ctx.scale(this._scale, this._scale);

        this._renderScaffolding(ctx, layout.scaffolding);

        ctx.font = this._font();
        // Calculate missing text metrics.
        for (var person of layout.positions.keys()) {
            var fullName = person.fullName();
            if (!this._textMetrics.has(fullName))
                this._textMetrics.set(fullName, ctx.measureText(fullName));
            var dates = person.dates();
            if (!this._textMetrics.has(dates))
                this._textMetrics.set(dates, ctx.measureText(dates));
        }

        for (var person of layout.positions.keys())
            this._renderPerson(ctx, layout, person);
        ctx.restore();
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

        if (person.isChild()) {
            ctx.fillStyle = "white";
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = color;
            ctx.stroke();
        } else {
            ctx.fillStyle = color;
            ctx.fill();
        }

        var rotation = g.normalizeRad(layout.rotations.get(person));
        var cumulativeRotation = g.normalizeRad(rotation);
        var textOnLeft = cumulativeRotation > Math.PI / 2 && cumulativeRotation < 3 * Math.PI / 2;
        if (textOnLeft)
            rotation -= Math.PI;

        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(rotation);
        var fullName = this._prerenderText(person.fullName(), color);
        var dates = this._prerenderText(person.dates(), color);
        if (textOnLeft) {
            var textWidth = fullName.width;
            ctx.drawImage(fullName, -personRadius - 3 - textWidth, -fullName.height);
            textWidth = dates.width;
            ctx.drawImage(dates, -personRadius - 3 - textWidth, 0);
        } else {
            ctx.drawImage(fullName, personRadius + 3, -fullName.height);
            ctx.drawImage(dates, personRadius + 3, 0);
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
