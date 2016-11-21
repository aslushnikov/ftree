self.app = {};

document.addEventListener('DOMContentLoaded', startApplication);

function startApplication() {
    app.DataLoader.loadCSV('assets/kalashyan_en.csv').then(onTreeLoaded);

    function onTreeLoaded(tree) {
        console.log(tree);
        var canvasElement = document.querySelector('canvas');
        var renderer = new app.CanvasRenderer(canvasElement);
        var sunLayout = new app.SunLayout(tree, renderer.width(), renderer.height());
        renderer.render(sunLayout);

        // For debug.
        window.t = tree;
        window.l = sunLayout;
    }
}
