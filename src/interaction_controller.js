app.InteractionController = class {
    constructor(engine, renderer, loop, overlay) {
        this._overlay = overlay;
        this._viewport = overlay.querySelector('.viewport');
        this._engine = engine;
        this._renderer = renderer;
        this._loop = loop;
        this._minScale = 1;
        this._maxScale = 1.5;
        this._center = g.zeroVec;

        this._canvas = renderer.canvasElement();
        this._canvas.addEventListener('mousedown', this._onMouseDown.bind(this));
        this._canvas.addEventListener('mouseup', this._onMouseUp.bind(this));
        this._canvas.addEventListener('mousemove', this._onMouseMove.bind(this));
        this._canvas.addEventListener('mouseout', this._onMouseUp.bind(this));
        // IE9, Chrome, Safari, Opera
        this._canvas.addEventListener("mousewheel", this._onMouseWheel.bind(this), false);
        // Firefox
        this._canvas.addEventListener("DOMMouseScroll", this._onMouseWheel.bind(this), false);

        window.addEventListener('resize', this._onResize.bind(this));
        this._engine.addListener(app.LayoutEngine.Events.LayoutRecalculated, this._centerGraph.bind(this));
        this._onResize();
    }

    _onResize() {
        this._renderer.setSize(document.body.clientWidth, document.body.clientHeight);
        this._centerGraph();
    }

    _computeGraphCenter(boundingBox) {
        var boundingBox = this._engine.layout().boundingBox();
        var centerX = boundingBox.x + boundingBox.width / 2;
        var centerY = boundingBox.y + boundingBox.height / 2;
        return new g.Vec(-centerX, -centerY).scale(this._minScale/app.CanvasRenderer.canvasRatio());
    }

    _centerGraph() {
        var boundingBox = this._engine.layout().boundingBox();
        var viewportBox = this._viewport.getBoundingClientRect();
        var rendererSize = this._renderer.size();
        var viewportWidth = viewportBox.width * app.CanvasRenderer.canvasRatio();
        var viewportHeight = viewportBox.height * app.CanvasRenderer.canvasRatio();
        this._minScale = 1;
        if (boundingBox.width !== 0 && boundingBox.height !== 0) {
            var hw = viewportWidth / 2;
            var hh = viewportHeight / 2;
            this._minScale = Math.min(hw / Math.abs(boundingBox.x), this._minScale);
            this._minScale = Math.min(hw / Math.abs(boundingBox.x + boundingBox.width), this._minScale);
            this._minScale = Math.min(hh / Math.abs(boundingBox.y), this._minScale);
            this._minScale = Math.min(hh / Math.abs(boundingBox.y + boundingBox.height), this._minScale);
            this._minScale *= 0.9;
        }
        this._renderer.setScale(this._minScale);
        var viewportCenter = new g.Vec((viewportBox.left + viewportBox.width / 2), (viewportBox.top + viewportBox.height / 2));
        var canvasCenter = new g.Vec(rendererSize.width / 2, rendererSize.height / 2);
        this._center = viewportCenter.subtract(canvasCenter.scale(1/app.CanvasRenderer.canvasRatio()));
        this._renderer.setOffset(this._center);
        this._loop.invalidate();
    }

    /**
     * @param {!Event} event
     * @return {!g.Vec}
     */
    _toCoordinates(event) {
        var rect = this._canvas.getBoundingClientRect();
        var center = new g.Vec(rect.left + rect.width / 2, rect.top + rect.height / 2);
        var point = new g.Vec(event.clientX, event.clientY);
        return point.subtract(center);
    }

    _onMouseWheel(event) {
        var delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));
        var fixedPoint = this._toCoordinates(event);
        var zoomStep = 0.06;
        var newZoom = this._renderer.scale() + zoomStep * delta;
        newZoom = Math.max(newZoom, this._minScale);
        newZoom = Math.min(newZoom, this._maxScale);
        this._overlay.classList.toggle('hidden-overlay', !g.eq(newZoom, this._minScale));
        this._renderer.setScale(newZoom, fixedPoint);
        this._constrainOffset();
        this._loop.invalidate();
        event.preventDefault();
        event.stopPropagation();
    }

    _onMouseDown(event) {
        this._mouseDownCoordinate = this._toCoordinates(event);
        this._mouseDownOffset = this._renderer.offset();
        event.preventDefault(true);
        event.stopPropagation();
    }

    _onMouseMove(event) {
        if (!this._mouseDownCoordinate)
            return;
        var moveOffset = this._toCoordinates(event).subtract(this._mouseDownCoordinate);
        var newOffset = this._mouseDownOffset.add(moveOffset);
        this._renderer.setOffset(newOffset);
        this._constrainOffset();
        this._loop.invalidate();
    }

    _constrainOffset() {
        var offset = this._renderer.offset();
        var boundingBox = this._engine.layout().boundingBox();
        var maxDimension = -Infinity;
        maxDimension = Math.max(maxDimension, Math.abs(boundingBox.x));
        maxDimension = Math.max(maxDimension, Math.abs(boundingBox.y));
        maxDimension = Math.max(maxDimension, Math.abs(boundingBox.x + boundingBox.width));
        maxDimension = Math.max(maxDimension, Math.abs(boundingBox.y + boundingBox.height));
        maxDimension = maxDimension * this._renderer.scale() / app.CanvasRenderer.canvasRatio();
        var minRendererSize = Math.min(this._renderer.size().width, this._renderer.size().height) / app.CanvasRenderer.canvasRatio() / 2;
        var maxOffset = Math.max(maxDimension - minRendererSize, 0);
        var center = g.eq(this._renderer.scale(), this._minScale) ? this._center : g.zeroVec;
        var radiusVector = offset.subtract(center);
        var len = radiusVector.len();
        if (len > maxOffset) {
            radiusVector = radiusVector.scale(maxOffset / len);
            this._renderer.setOffset(center.add(radiusVector));
            this._loop.invalidate();
        }
    }

    _onMouseUp(event) {
        this._mouseDownCoordinate = null;
        this._mouseDownOffset = null;
    }
}
