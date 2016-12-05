self.app = {};

document.addEventListener('DOMContentLoaded', startApplication);

var storage = window.localStorage || {};

function startApplication() {
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

    fetch('./assets/configs.json')
        .then(response => response.json())
        .then(onConfigs);

    function onConfigs(configs) {
        var preselectConfigName = storage['configName'];
        var preselectConfig = null;
        var selector = document.querySelector('.config-selector');
        for (var i = 0; i < configs.length; ++i) {
            var option = selector.createChild('option');
            option.textContent = configs[i].name;
            option.value = i;
            if (configs[i].name === preselectConfigName) {
                preselectConfig = configs[i];
                option.selected = true;
            }
        }
        selector.addEventListener('input', () => selectConfig(configs[selector.value]));
        if (!preselectConfig && configs.length)
            preselectConfig = configs[0];
        if (preselectConfig)
            selectConfig(preselectConfig);
    }

    function selectConfig(config) {
        storage['configName'] = config.name;
        app.TreeLoader.loadCSV(config.tree).then(tree => layout.setFamilyTree(tree));

        fetch(config.legend).then(response => response.json()).then(renderLegend);
    }

    function renderLegend(legendJSON) {
        document.querySelector("header .title").textContent = legendJSON.title;
        document.querySelector("header .subtitle").textContent = legendJSON.subtitle;
        var stories = document.querySelector('.stories');
        stories.textContent = '';
        var columns = legendJSON['text_columns'];
        for (var column of columns) {
            var story = stories.createChild('div', 'story');
            story.innerHTML = column;
        }
    }
}

