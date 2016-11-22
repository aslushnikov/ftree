self.app = {};

document.addEventListener('DOMContentLoaded', startApplication);

function startApplication() {
    var canvasElement = document.querySelector('canvas');
    var renderer = new app.CanvasRenderer(canvasElement);
    app.DataLoader.loadCSV('assets/kalashyan_en.csv').then(onTreeLoaded);

    var radiusValue = document.querySelector('.radius-value');
    var radiusSlider = document.querySelector('.radius-control');
    radiusSlider.addEventListener('input', () => {
        radiusValue.textContent  = radiusSlider.value + 'px';
        render();
    });

    var overlapValue = document.querySelector('.overlap-value');
    var overlapSlider = document.querySelector('.overlap-control');
    overlapSlider.addEventListener('input', () => {
        overlapValue.textContent = overlapSlider.value + 'deg';
        render();
    });

    function onTreeLoaded(tree) {
        console.log(tree);
        self.app.familyTree = tree;
        render();
    }

    function render() {
        requestAnimationFrame(() => {
            var radius = parseFloat(radiusSlider.value);
            var overlap = parseFloat(overlapSlider.value);
            overlap = overlap / 360 * 2 * Math.PI;
            renderer.render(new app.SunLayout(self.app.familyTree, radius, overlap, 200));
        });
    }
}
