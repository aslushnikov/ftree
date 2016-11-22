self.app = {};

document.addEventListener('DOMContentLoaded', startApplication);

function startApplication() {
    var canvasElement = document.querySelector('canvas');
    var renderer = new app.CanvasRenderer(canvasElement);
    app.DataLoader.loadCSV('assets/kalashyan_en.csv').then(onTreeLoaded);

    var radiusSlider = document.querySelector('.radius-control');
    radiusSlider.addEventListener('input', render);

    function onTreeLoaded(tree) {
        console.log(tree);
        self.app.familyTree = tree;
        render();
    }

    function render() {
        requestAnimationFrame(() => {
            var radius = parseFloat(radiusSlider.value);
            renderer.render(new app.SunLayout(self.app.familyTree, radius, 200));
        });
    }
}
