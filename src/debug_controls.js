app.DebugControls = class {
    constructor(layout, renderer, loop) {
        var element = createElementWithClass('div', 'controls');
        this._element = element;
        // setting up layout controls
        var layoutControls = element.createChild('fieldset', '.layout-controls');
        layoutControls.createChild('legend').textContent = 'Sun Layout Controls';
        var layoutSliders = [
            new app.Slider('size', size => layout.setSize(size))
                .setValues(1000, 7000, layout.size())
                .setSuffix('px'),
            new app.Slider('rotation', deg => layout.setInitialRotation(g.degToRad(deg)))
                .setValues(0, 360, g.radToDeg(layout.initialRotation()))
                .setSuffix('deg'),
            new app.Slider('radius', radius => layout.setPersonRadius(radius))
                .setValues(5, 50, layout.personRadius())
                .setSuffix('px'),
            new app.Slider('overlap', overlap => layout.setOverlap(g.degToRad(overlap)))
                .setValues(-360, 360, g.radToDeg(layout.overlap()))
                .setSuffix('deg'),
        ];
        layoutSliders.forEach(slider => layoutControls.appendChild(slider.element()));

        // setting up layout controls
        var rendererControls = element.createChild('fieldset', '.renderer-controls');
        rendererControls.createChild('legend').textContent = 'Renderer controls';
        var rendererSliders = [
            new app.Slider('root font scale', scale => {renderer.setRootFontScale(scale); loop.invalidate(); })
                .setValues(1, 4, renderer.rootFontScale(), 0.1)
                .setSuffix(' times'),
            new app.Slider('name font size', fontSize => {renderer.setNameFontSize(fontSize); loop.invalidate(); })
                .setValues(7, 36, renderer.nameFontSize())
                .setSuffix('px'),
            new app.Slider('dates font size', fontSize => {renderer.setDatesFontSize(fontSize); loop.invalidate(); })
                .setValues(7, 36, renderer.datesFontSize())
                .setSuffix('px'),
        ];
        rendererSliders.forEach(slider => rendererControls.appendChild(slider.element()));
    }

    /**
     * @return {!Element}
     */
    element() {
        return this._element;
    }
}

app.Slider = class {
    /**
     * @param {string} name
     * @param {function(number)} valueChangedCallback
     */
    constructor(name, valueChangedCallback) {
        this._element = document.createElement('div');
        this._element.classList.add('slider');

        var label = this._element.createChild('div');
        label.textContent = name;

        this._slider = this._element.createChild('input');
        this._slider.type = 'range';
        this._slider.min = 1;
        this._slider.max = 10;
        this._slider.value = 5;

        this._valueElement = this._element.createChild('div');
        this._valueElement.classList.add('value');
        this.setSuffix('');

        this._slider.addEventListener('input', () => {
            this._updateValue();
            valueChangedCallback(parseFloat(this._slider.value));
        });
    }

    /**
     * @return {!Element}
     */
    element() {
        return this._element;
    }

    /**
     * @param {string} className
     */
    setClass(className) {
        this._element.classList.add(className);
        return this;
    }

    /**
     * @param {number} min
     * @param {number} max
     * @param {number} value
     * @param {number} step
     * @return {!app.Slider}
     */
    setValues(min, max, value, step) {
        console.assert(min <= value && value <= max);
        this._slider.step = step || 1;;
        this._slider.min = min;
        this._slider.max = max;
        this._slider.value = value;
        this._updateValue();
        return this;
    }

    _updateValue() {
        this._valueElement.textContent = this._slider.value + this._suffix;
    }

    /**
     * @param {string} suffix
     * @return {!app.Slider}
     */
    setSuffix(suffix) {
        this._suffix = suffix;
        this._updateValue();
        return this;
    }
}

