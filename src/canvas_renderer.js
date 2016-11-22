app.CanvasRenderer = class {
    constructor(canvasElement) {
        this._width = canvasElement.width;
        this._height = canvasElement.height;
        this._context = canvasElement.getContext('2d');

        // Properties.
        this._personRadius = 5;
    }

    /**
     * @return {number}
     */
    width() {
        return this._width;
    }

    /**
     * @return {number}
     */
    height() {
        return this._width;
    }

    /**
     * @param {!app.Layout} layout
     */
    render(layout) {
        this._context.save();
        this._context.translate(this._width / 2, this._height / 2);
        this._renderScaffolding(this._context, layout);
        for (var person of layout.people())
            this._renderPerson(this._context, layout, person);
        this._context.restore();
    }

    /**
     * @param {!CanvasRenderingContext2D} ctx
     * @param {!app.Layout} layout
     */
    _renderScaffolding(ctx, layout) {
        ctx.clearRect(0, 0, this._width, this._height);
        var shapes = layout.scaffolding();
        ctx.beginPath();
        for (var shape of shapes) {
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
        ctx.beginPath();
        var position = layout.personPosition(person);
        ctx.moveTo(position.x + this._personRadius, position.y);
        ctx.arc(position.x, position.y, this._personRadius, 0, 2*Math.PI);
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

        var rotation = position.angleTo(new g.Vec(10, 0));
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
            ctx.fillText(person.fullName(), -this._personRadius - 3 - textWidth, 0);
            ctx.textBaseline = 'top';
            textWidth = ctx.measureText(person.dates()).width;
            ctx.fillText(person.dates(), -this._personRadius - 3 - textWidth, 0);
        } else {
            ctx.fillText(person.fullName(), this._personRadius + 3, 0);
            ctx.textBaseline = 'top';
            ctx.fillText(person.dates(), this._personRadius + 3, 0);
        }
        ctx.restore();
    }
}
