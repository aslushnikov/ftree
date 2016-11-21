self.app = {};

document.addEventListener('DOMContentLoaded', startApplication);

function startApplication() {
    app.DataLoader.loadCSV('assets/kalashyan_en.csv').then(onTreeLoaded);

    function onTreeLoaded(tree) {
        console.log(tree);
        var renderer = new app.CanvasRenderer(document.querySelector('canvas'));
        renderer.render(new app.SunLayout(tree));
    }
}
