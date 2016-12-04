self.app = {};
var CONFIG_NAME = './assets/kalashyan.json';

document.addEventListener('DOMContentLoaded', startApplication.bind(null, CONFIG_NAME));

function startApplication(configName) {
    // setting up renderer and layout.
    var layout = new app.SunLayout();
    var renderer = new app.CanvasRenderer(document.body.clientWidth, document.body.clientHeight);
    var loop = new app.RenderLoop(renderer, layout);

    // setting defaults
    layout.setPersonRadius(41);
    layout.setSize(5570);
    layout.setOverlap(g.degToRad(142));
    layout.setInitialRotation(g.degToRad(0));

    var image = new Image();
    image.src = './assets/map.png';
    image.onload = () => layout.setBackgroundImage(image);

    document.body.appendChild(renderer.canvasElement());
    var interactionController = new app.InteractionController(layout, renderer, loop);

    var debugControls = new app.DebugControls(layout, renderer, loop);
    document.body.appendChild(debugControls.element());

    // Load tree
    app.TreeLoader.loadCSV('assets/kalashyan-tree.en.csv').then(tree => layout.setFamilyTree(tree));
}


