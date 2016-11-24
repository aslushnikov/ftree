self.app = {};

document.addEventListener('DOMContentLoaded', startApplication);

function startApplication() {
    // setting up controls
    var radiusValue = document.querySelector('.radius-value');
    var radiusSlider = document.querySelector('.radius-control');
    radiusSlider.addEventListener('input', () => {
        radiusValue.textContent  = radiusSlider.value + 'px';
    });

    var overlapValue = document.querySelector('.overlap-value');
    var overlapSlider = document.querySelector('.overlap-control');
    overlapSlider.addEventListener('input', () => {
        overlapValue.textContent = overlapSlider.value + 'deg';
    });

    // setting up renderer and layout.
    var canvasElement = document.querySelector('canvas');
    var renderer = new app.CanvasRenderer(canvasElement);
    app.TreeLoader.loadCSV('assets/kalashyan_en.csv').then(onTreeLoaded);

    function onTreeLoaded(tree) {
        console.log(tree);
        var sunLayout = new app.SunLayout(tree);
        renderLoop();

        function renderLoop() {
            var radius = parseFloat(radiusSlider.value);
            var overlap = parseFloat(overlapSlider.value);
            overlap = overlap / 360 * 2 * Math.PI;
            sunLayout.setPersonRadius(radius);
            sunLayout.setOverlap(overlap);
            if (sunLayout.isDirty())
                renderer.render(sunLayout.layout());
            requestAnimationFrame(renderLoop);
        }
    }
}

