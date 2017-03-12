app.InteractionController = class {
    constructor(engine, renderer, overlay) {
        this._overlay = overlay;
        this._viewport = overlay.querySelector('.viewport');
        this._engine = engine;
        this._renderer = renderer;
        this._minScale = 1;
        this._maxScale = 1.5;
        this._center = g.zeroVec;

        this._element = renderer.element();
        this._element.addEventListener('mousedown', this._onMouseDown.bind(this));
        this._element.addEventListener('mouseup', this._onMouseUp.bind(this));
        this._element.addEventListener('mousemove', this._onMouseMove.bind(this));
        this._element.addEventListener('mouseleave', this._onMouseUp.bind(this));
        this._element.addEventListener('touchstart', this._onMouseDown.bind(this));
        this._element.addEventListener('touchend', this._onMouseUp.bind(this));
        this._element.addEventListener('touchmove', this._onMouseMove.bind(this));
        this._element.addEventListener('touchcancel', this._onMouseUp.bind(this));
        // IE9, Chrome, Safari, Opera
        this._element.addEventListener("mousewheel", this._onMouseWheel.bind(this), false);
        // Firefox
        this._element.addEventListener("DOMMouseScroll", this._onMouseWheel.bind(this), false);
        this._element.addEventListener("gesturestart", this._onGestureStart.bind(this), false);
        this._element.addEventListener("gesturechange", this._onGestureChange.bind(this), false);
        this._element.addEventListener("gestureend", this._onGestureEnd.bind(this), false);

        window.addEventListener('resize', this._onResize.bind(this));
        this._engine.addListener(app.LayoutEngine.Events.LayoutRecalculated, this._centerGraph.bind(this));
        this._onResize();
    }

    _onResize() {
        this._renderer.setSize(document.body.clientWidth, document.body.clientHeight);
        this._centerGraph();
    }

    _centerGraph() {
        var boundingBox = this._engine.layout().boundingBox();
        var viewportBox = this._viewport.getBoundingClientRect();
        var rendererSize = this._renderer.size();
        var viewportWidth = viewportBox.width;
        var viewportHeight = viewportBox.height;
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
        this._center = viewportCenter.subtract(canvasCenter);
        this._renderer.setOffset(this._center);
    }

    /**
     * @param {!Event} event
     * @return {!g.Vec}
     */
    _toCoordinates(event) {
        var size = this._renderer.size();
        var center = new g.Vec(size.width / 2, size.height / 2);
        var eventX = 0;
        var eventY = 0;
        // Support touch events
        if (event.changedTouches && event.changedTouches.length) {
            var N = event.changedTouches.length;
            for (var i = 0; i < N; ++i) {
                var touch = event.changedTouches[i];
                eventX += touch.clientX;
                eventY += touch.clientY;
            }
            eventX /= N;
            eventY /= N;
        } else {
            eventX = event.clientX;
            eventY = event.clientY;
        }
        console.assert(typeof eventX === 'number', 'Bitch please!!!');
        var point = new g.Vec(eventX, eventY);
        return point.subtract(center);
    }

    _handleZoom(newZoom, fixedPoint) {
        this._overlay.classList.toggle('hidden-overlay', !g.eq(newZoom, this._minScale));
        var oldOffset = this._renderer.offset();
        var oldScale = this._renderer.scale();

        var layoutFixedPoint = this._renderer.toLayoutCoordinates(fixedPoint);
        this._renderer.setScale(newZoom);
        var newRenderFixedPoint = this._renderer.toRenderCoordinates(layoutFixedPoint);
        var diff = newRenderFixedPoint.subtract(fixedPoint);
        this._renderer.setOffset(oldOffset.subtract(diff));

        this._constrainOffset();
    }

    _onGestureStart(event) {
        this._isHandlingGesture = true;
        this._gestureStartScale = this._renderer.scale();
        event.preventDefault(true);
        event.stopPropagation();
    }

    _onGestureEnd(event) {
        this._isHandlingGesture = false;
        this._gestureStartScale = null;
        event.preventDefault(true);
        event.stopPropagation();
    }

    _onGestureChange(event) {
        var zoomStep = 0.06;
        var newZoom = this._gestureStartScale * event.scale;
        newZoom = Math.max(newZoom, this._minScale);
        newZoom = Math.min(newZoom, this._maxScale);
        var fixedPoint = this._toCoordinates(event);
        this._handleZoom(newZoom, fixedPoint);
        event.preventDefault(true);
        event.stopPropagation();
    }

    _onMouseWheel(event) {
        var delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));
        var fixedPoint = this._toCoordinates(event);
        var zoomStep = 0.06;
        var newZoom = this._renderer.scale() + zoomStep * delta;
        newZoom = Math.max(newZoom, this._minScale);
        newZoom = Math.min(newZoom, this._maxScale);
        this._handleZoom(newZoom, fixedPoint);
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
        // Do not handle gesture events.
        if (this._isHandlingGesture)
            return;
        var moveOffset = this._toCoordinates(event).subtract(this._mouseDownCoordinate);
        var newOffset = this._mouseDownOffset.add(moveOffset);
        this._renderer.setOffset(newOffset);
        this._constrainOffset();
        event.preventDefault(true);
        event.stopPropagation();
    }

    _constrainOffset() {
        if (g.eq(this._renderer.scale(), this._minScale)) {
            this._renderer.setOffset(this._center);
            return;
        }
        var offset = this._renderer.offset();
        var boundingBox = this._engine.layout().boundingBox();
        var maxDimension = -Infinity;
        maxDimension = Math.max(maxDimension, Math.abs(boundingBox.x));
        maxDimension = Math.max(maxDimension, Math.abs(boundingBox.y));
        maxDimension = Math.max(maxDimension, Math.abs(boundingBox.x + boundingBox.width));
        maxDimension = Math.max(maxDimension, Math.abs(boundingBox.y + boundingBox.height));
        maxDimension = maxDimension * this._renderer.scale();
        maxDimension += Math.max(Math.abs(this._center.x), Math.abs(this._center.y));
        var minRendererSize = Math.min(this._renderer.size().width, this._renderer.size().height) / 2;
        var maxOffset = Math.max(maxDimension - minRendererSize/2, 0);
        var radiusVector = offset.subtract(this._center);
        var len = radiusVector.len();
        if (len > maxOffset) {
            radiusVector = radiusVector.scale(maxOffset / len);
            this._renderer.setOffset(this._center.add(radiusVector));
        }
    }

    _onMouseUp(event) {
        this._mouseDownCoordinate = null;
        this._mouseDownOffset = null;
    }
}
