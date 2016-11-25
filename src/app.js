self.app = {};

document.addEventListener('DOMContentLoaded', startApplication);

function startApplication() {
    // setting up renderer and layout.
    var layoutEngine = new app.SunLayout();
    var renderer = new app.CanvasRenderer(document.body.clientWidth, document.body.clientHeight);
    var renderLoop = new app.RenderLoop(renderer, layoutEngine);

    document.body.appendChild(renderer.canvasElement());

    // setting up layout controls
    var layoutControls = document.querySelector('.layout-controls');
    var layoutSliders = [
        new app.Slider('radius', radius => layoutEngine.setPersonRadius(radius))
            .setValues(5, 50, 25)
            .setSuffix('px'),
        new app.Slider('overlap', overlap => layoutEngine.setOverlap(overlap))
            .setValues(0, 360, 0)
            .setSuffix('deg'),
        new app.Slider('size', size => layoutEngine.setSize(size))
            .setValues(100, 5000, 1000)
            .setSuffix('px'),
    ];
    layoutSliders.forEach(slider => layoutControls.appendChild(slider.element()));

    // setting up layout controls
    var rendererControls = document.querySelector('.renderer-controls');
    var rendererSliders = [
        new app.Slider('zoom', zoom => {renderer.setScale(zoom); renderLoop.invalidate(); })
            .setValues(0.1, 5, 1, 0.1)
            .setClass('zoom-slider')
    ];
    rendererSliders.forEach(slider => rendererControls.appendChild(slider.element()));

    // Load tree
    app.TreeLoader.loadCSV('assets/kalashyan_en.csv').then(onTreeLoaded);

    window.addEventListener('resize', onResize);

    function onTreeLoaded(tree) {
        console.log(tree);
        layoutEngine.setFamilyTree(tree);
    }

    function onResize() {
        renderer.setSize(document.body.clientWidth, document.body.clientHeight);
        renderLoop.invalidate();
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
            var value = parseFloat(this._slider.value);
            this._valueElement.textContent = value + this._suffix;
            valueChangedCallback(value);
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
        this._slider.min = min;
        this._slider.max = max;
        this._slider.value = value;
        this._slider.step = step || 1;;
        return this;
    }

    /**
     * @param {string} suffix
     * @return {!app.Slider}
     */
    setSuffix(suffix) {
        this._suffix = suffix;
        this._valueElement.textContent = this._slider.value + suffix;
        return this;
    }
}

