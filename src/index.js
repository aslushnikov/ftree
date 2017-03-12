document.addEventListener('DOMContentLoaded', startApplication);

var storage = getLocalStorage() || {};

function startApplication() {
    // setting up renderer and layout.
    var layout = new app.SunLayout();
    var useSVG = !window.location.hash.includes('canvas');
    var renderer = useSVG ? new app.SVGRenderer(document.body.clientWidth, document.body.clientHeight) : new app.CanvasRenderer(document.body.clientWidth, document.body.clientHeight);
    new app.RenderLoop(renderer, layout);

    // setting defaults
    // For some reason, Canvas renderer does a 2x scaling. Thus
    // defaults are different for different renderers.
    if (useSVG) {
        layout.setPersonRadius(16);
        layout.setSize(3300);
        layout.setOverlap(g.degToRad(100));
        layout.setInitialRotation(g.degToRad(0));
        layout.setLevelSizeOffset(1, 90);
    } else {
        layout.setPersonRadius(30);
        layout.setSize(5000);
        layout.setOverlap(g.degToRad(112));
        layout.setInitialRotation(g.degToRad(0));
        layout.setLevelSizeOffset(1, 200);
    }

    document.body.appendChild(renderer.element());

    var overlay = document.querySelector('.overlay');
    var interactionController = new app.InteractionController(layout, renderer, overlay);

    if (window.location.hash.includes('debug')) {
        var debugControls = new app.DebugControls(layout, renderer);
        document.body.appendChild(debugControls.element());
    }

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

        Promise.all([
            app.TreeLoader.loadCSV(config.tree),
            fetch(config.legend).then(response => response.json()).then(renderLegend)
        ]).then(results => {
            var tree = results[0];
            layout.setFamilyTree(tree);
        });

        var image = new Image();
        image.src = config.background;
        image.onload = () => layout.setBackgroundImage(image);
    }

    function renderLegend(legendJSON) {
        renderer.setDatesFormatter(datesFormatter.bind(null, legendJSON.birth_abbreviation, legendJSON.death_abbreviation));
        var overlay = document.querySelector('.overlay');
        overlay.querySelector("header .title").textContent = legendJSON.title;
        overlay.querySelector("header .subtitle").textContent = legendJSON.subtitle;
        var footer = overlay.querySelector('footer');
        footer.textContent = '';
        var stories = footer.createChild('div', 'stories');
        var columns = legendJSON['text_columns'];
        for (var column of columns) {
            var story = stories.createChild('div', 'story');
            story.innerHTML = column;
        }
        var footer = overlay.querySelector('footer');
        footer.appendChild(mapLegend(legendJSON));

        var tutorial = overlay.querySelector('.tutorial');
        tutorial.textContent = legendJSON.tutorial;
    }

    function mapLegend(legendJSON) {
        var mapLegend = document.createElement('div');
        mapLegend.classList.add('story');
        mapLegend.classList.add('map-legend');
        mapLegend.appendChild(createLegendLine(legendJSON.map_legend.father, app.Gender.Male, false, false));
        mapLegend.appendChild(createLegendLine(legendJSON.map_legend.mother, app.Gender.Female, false, false));
        mapLegend.appendChild(createLegendLine(legendJSON.map_legend.infant_male, app.Gender.Male, true, false));
        mapLegend.appendChild(createLegendLine(legendJSON.map_legend.infant_female, app.Gender.Female, true, false));
        mapLegend.appendChild(createLegendLine(legendJSON.map_legend.deceased, app.Gender.Male, false, true));

        return mapLegend;
    }

    function createLegendLine(name, gender, isChild, isDeceased) {
        var line = document.createElement('div');
        line.classList.add('legend-line');
        var icon = renderer.createPersonIcon(17, gender, isChild, isDeceased);
        icon.classList.add('legend-icon');
        line.appendChild(icon);
        var text = line.createChild('div', 'legend-text');
        text.textContent = name;
        line.appendChild(text);
        return line;
    }
}

function datesFormatter(birthAbbreviation, deathAbbreviation, person) {
    if (person.birthYear && person.deathYear)
        return person.birthYear + ' - ' + person.deathYear;
    if (person.birthYear)
        return birthAbbreviation + ' ' + person.birthYear;
    if (person.deathYear)
        return deathAbbreviation + ' ' + person.deathYear;
    return '';
}
