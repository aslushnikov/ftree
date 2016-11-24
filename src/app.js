self.app = {};

document.addEventListener('DOMContentLoaded', startApplication);

function startApplication() {
    // setting up renderer and layout.
    var canvasElement = document.querySelector('canvas');
    var layoutEngine = new app.SunLayout();
    var renderer = new app.CanvasRenderer(canvasElement);
    var renderLoop = new app.RenderLoop(renderer, layoutEngine);

    // setting up controls
    var radiusValue = document.querySelector('.radius-value');
    var radiusSlider = document.querySelector('.radius-control');
    radiusSlider.addEventListener('input', () => {
        var radius = parseFloat(radiusSlider.value);
        layoutEngine.setPersonRadius(radius);
        radiusValue.textContent  = radiusSlider.value + 'px';
    });

    var overlapValue = document.querySelector('.overlap-value');
    var overlapSlider = document.querySelector('.overlap-control');
    overlapSlider.addEventListener('input', () => {
        overlapValue.textContent = overlapSlider.value + 'deg';
        var overlap = parseFloat(overlapSlider.value);
        overlap = overlap / 360 * 2 * Math.PI;
        layoutEngine.setOverlap(overlap);
    });

    // Load tree
    app.TreeLoader.loadCSV('assets/kalashyan_en.csv').then(onTreeLoaded);

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    function onTreeLoaded(tree) {
        console.log(tree);
        layoutEngine.setFamilyTree(tree);
    }

    function resizeCanvas() {
        canvasElement.width = document.body.clientWidth;
        canvasElement.height = document.body.clientHeight;
        renderLoop.invalidate();
    }
}

