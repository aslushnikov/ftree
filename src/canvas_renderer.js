app.CanvasRenderer = class {
    constructor(canvasElement) {
        this._width = canvasElement.width;
        this._height = canvasElement.height;
        this._context = canvasElement.getContext('2d');
    }

    render(layout) {
        var ctx = this._context;
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
        ctx.stroke();
    }
}
