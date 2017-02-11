app.Renderer = class {
    /**
     * @return {!Element}
     */
    element() {}

    /**
     * @param {number} width
     * @param {number} height
     */
    setSize(width, height) { }

    size() { }

    /**
     * @param {number} scale
     */
    setScale(scale) { }

    /**
     * @return {number}
     */
    scale() { }

    /**
     * @param {!g.Vec} offset
     */
    setOffset(offset) { }

    /**
     * @return {!g.Vec}
     */
    offset() { }

    /**
     * @param {!app.Layout} layout
     */
    render(layout) { }

    /**
     * @param {number} size
     * @param {!App.Gender} gender
     * @param {boolean} isChild
     * @param {boolean} isDeceased
     * @return {!Element}
     */
    createPersonIcon(size, gender, isChild, isDeceased) { }
}

