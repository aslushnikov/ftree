app.CanvasRenderer = class {
    constructor(canvasElement) {
        this._canvas = canvasElement;
        this._context = canvasElement.getContext('2d');
    }

    /**
     * @param {!app.Layout} layout
     */
    render(layout) {
        var width = this._canvas.width;
        var height = this._canvas.height;
        this._context.clearRect(0, 0, width, height);
        this._context.save();
        this._context.translate(width / 2, height / 2);
        this._renderScaffolding(this._context, layout.scaffolding);
        for (var person of layout.positions.keys())
            this._renderPerson(this._context, layout, person);
        this._context.restore();
    }

    /**
     * @param {!CanvasRenderingContext2D} ctx
     * @param {!app.Layout} layout
     */
    _renderScaffolding(ctx, scaffolding) {
        ctx.beginPath();
        for (var shape of scaffolding) {
            if (shape instanceof g.Line) {
                var line = /** @type {!g.Line} */(shape);
                ctx.moveTo(line.from.x, line.from.y);
                ctx.lineTo(line.to.x, line.to.y);
            } else if (shape instanceof g.Arc) {
                var arc = /** @type {!g.Arc} */(shape);
                ctx.moveTo(arc.from.x, arc.from.y);
                ctx.arc(arc.center.x, arc.center.y, arc.r, arc.fromAngle, arc.toAngle, false);
            } else if (shape instanceof g.Bezier) {
                var bezier = /** @type {!g.Bezier} */(shape);
                ctx.moveTo(bezier.from.x, bezier.from.y);
                ctx.quadraticCurveTo(bezier.cp.x, bezier.cp.y, bezier.to.x, bezier.to.y);
            }
        }
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'darkgray';
        ctx.stroke();
    }

    /**
     * @param {!CanvasRenderingContext2D} ctx
     * @param {!app.Layout} layout
     * @param {!app.Person} person
     */
    _renderPerson(ctx, layout, person) {
        var position = layout.positions.get(person);
        var personRadius = layout.personRadius;

        ctx.beginPath();
        ctx.moveTo(position.x + personRadius, position.y);
        ctx.arc(position.x, position.y, personRadius, 0, 2*Math.PI);
        var color = 'gray';
        if (person.gender === app.Gender.Male)
            color = '#8eb2bd';
        else if (person.gender === app.Gender.Female)
            color = '#e89096';
        if (person.children.size) {
            ctx.fillStyle = color;
            ctx.fill();
        } else {
            ctx.fillStyle = "white";
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = color;
            ctx.stroke();
        }

        var rotation = layout.rotations.get(person);
        if (rotation < 0)
            rotation += Math.PI * 2;
        var textOnLeft = false;
        if (rotation > Math.PI / 2 && rotation < 3 * Math.PI / 2) {
            rotation -= Math.PI;
            textOnLeft = true;
        }

        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(rotation);
        ctx.font = '16px arial';
        ctx.fillStyle = color;
        ctx.textBaseline = 'bottom';
        if (textOnLeft) {
            var textWidth = ctx.measureText(person.fullName()).width;
            ctx.fillText(person.fullName(), -personRadius - 3 - textWidth, 0);
            ctx.textBaseline = 'top';
            textWidth = ctx.measureText(person.dates()).width;
            ctx.fillText(person.dates(), -personRadius - 3 - textWidth, 0);
        } else {
            ctx.fillText(person.fullName(), personRadius + 3, 0);
            ctx.textBaseline = 'top';
            ctx.fillText(person.dates(), personRadius + 3, 0);
        }
        ctx.restore();
    }
}

app.RenderLoop = class {
    /**
     * @param {!app.Renderer} renderer
     * @param {!app.LayoutEngine} layoutEngine
     */
    constructor(renderer, layoutEngine) {
        this._layoutEngine = layoutEngine;
        this._renderer = renderer;
        this._renderLoopBound = this._renderLoop.bind(this);

        // First render must be forced.
        this._invalidated = true;
        requestAnimationFrame(this._renderLoopBound);
    }

    _renderLoop() {
        if (this._invalidated || this._layoutEngine.isDirty()) {
            this._renderer.render(this._layoutEngine.layout());
            this._invalidated = false;
        }
        requestAnimationFrame(this._renderLoopBound);
    }

    invalidate() {
        this._invalidated = true;
    }
}
