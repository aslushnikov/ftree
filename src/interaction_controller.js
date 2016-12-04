app.InteractionController = class {
    constructor(engine, renderer, loop) {
        this._engine = engine;
        this._renderer = renderer;
        this._loop = loop;
        this._minScale = 1;
        this._maxScale = 1.5;

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

    _updateMinScale() {
    }

    _computeGraphCenter(boundingBox) {
        var boundingBox = this._engine.layout().boundingBox();
        var centerX = boundingBox.x + boundingBox.width / 2;
        var centerY = boundingBox.y + boundingBox.height / 2;
        return new g.Vec(-centerX, -centerY).scale(this._minScale/app.CanvasRenderer.canvasRatio());
    }

    _centerGraph() {
        var boundingBox = this._engine.layout().boundingBox();
        var rendererSize = this._renderer.size();
        if (boundingBox.width === 0 || boundingBox.height === 0)
            this._minScale = 1;
        else
            this._minScale = Math.min(rendererSize.width / boundingBox.width, rendererSize.height / boundingBox.height) * 0.9;
        this._renderer.setScale(this._minScale);
        this._renderer.setOffset(this._computeGraphCenter(boundingBox));
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
        this._renderer.setScale(newZoom, fixedPoint);
        this._loop.invalidate();
        event.preventDefault();
        event.stopPropagation();
    }

    _onMouseDown(event) {
        this._downCoord = this._toCoordinates(event);
        this._offset = this._renderer.offset();
        event.preventDefault(true);
        event.stopPropagation();
    }

    _onMouseMove(event) {
        if (!this._downCoord)
            return;
        var offset = this._toCoordinates(event).subtract(this._downCoord);
        this._renderer.setOffset(this._offset.add(offset));
        this._loop.invalidate();
    }

    _onMouseUp(event) {
        this._downCoord = null;
        this._offset = null;
    }
}
