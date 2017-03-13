document.addEventListener('DOMContentLoaded', startApplication);

var storage = getLocalStorage() || {};

function startApplication() {
    var viewport = document.body.querySelector('.viewport');

    // setting up renderer and layout.
    var layout = new app.SunLayout();
    var renderer = new app.SVGRenderer(10, 10);
    new app.RenderLoop(renderer, layout);

    // setting defaults
        layout.setPersonRadius(19);
        layout.setSize(5000);
        layout.setOverlap(g.degToRad(95));
        layout.setInitialRotation(g.degToRad(0));
        layout.setLevelSizeOffset(1, 90);
    layout.addListener(app.LayoutEngine.Events.LayoutRecalculated, onResize);

    viewport.appendChild(renderer.element());

    var debugControls = new app.DebugControls(layout, renderer);
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
        var overlay = document.body;
        overlay.querySelector("header .title").textContent = legendJSON.title;
        overlay.querySelector("header .subtitle").textContent = legendJSON.subtitle;
        var footer = overlay.querySelector('footer section');
        footer.textContent = '';
        var stories = footer.createChild('div', 'stories');
        var columns = legendJSON['print_columns'];
        for (var column of columns) {
            var story = stories.createChild('div', 'story');
            story.innerHTML = column;
        }
        var previous = document.querySelector('.map-legend');
        if (previous)
            previous.remove();
        document.body.appendChild(mapLegend(legendJSON));
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

    function onResize() {
        var boundingBox = layout.layout().boundingBox();
        var padding = 300;
        renderer.setSize(boundingBox.width + padding, boundingBox.height + padding);
        var center = new g.Vec(2 * boundingBox.x + boundingBox.width, 2 * boundingBox.y + boundingBox.height).scale(-0.5);
        renderer.setOffset(center);
        document.body.style.setProperty('width', renderer.size().width + 'px');
        document.body.style.setProperty('height', renderer.size().height + 'px');
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
