
// famous dependencies
let Node       = famous.core.Node
let DOMElement = famous.domRenderables.DOMElement
let Scene      = famous.core.Scene

cards = [] // storing temporary "cards" here to lay them out.

Node.prototype.getPositionFrom = function getPositionFrom (ancestor) {
    var position = new Float32Array(Array.prototype.slice.call(this.getPosition()));
    var currentParent = this.getParent();
    var parentPosition;

    if (!(ancestor instanceof Node))
        throw new Error(''+ancestor+' is not an instance of Node.');

    // Go through all the nodes up through the ancestor.
    while (currentParent && currentParent !== ancestor
        // stop at the scene node.
        && !(currentParent instanceof Scene)) {

        parentPosition = currentParent.getPosition();

        position[0] += parentPosition[0];
        position[1] += parentPosition[1];
        position[2] += parentPosition[2];

        currentParent = currentParent.getParent();
    }

    // if we reached null a null _parent and didn't find the target ancestor.
    if (!currentParent)
        throw new Error('Null parent reached, but '+ancestor+' is not an ancestor of this Node.');

    // or if we reached the scene node and didn't find the target ancestor.
    if (currentParent !== ancestor)
        throw new Error('Scene node reached, but '+ancestor+' is not an ancestor of this Node.');

    return position;
};

class UserStoryMapLayout extends Node {
    constructor() {
        super()
        this.columnWidth    = 200 + 20
        this.rowHeight      = 95 + 20
        this.childrenGetter = null
        this.rootItems      = null

        window.n = this
    }

    // traverses the trees in rootItems recursively.
    createLayout(numberOfLevels) {
        if (!this.childrenGetter)
            throw new Error(`
                You need to set the child getter with UserStoryMapLayout#setChildrenGetter first.
            `.trim().replace(/\s/, ' '))
        if (!this.rootItems)
            throw new Error(`
                You need to specify the root nodes with UserStoryMapLayout#setRootItems first.
            `.trim().replace(/\s/, ' '))

        let self = this
        let initialLevels = numberOfLevels

        // TODO: Remove. Random colors for now.
        var colors = []
        for (let i=0; i<numberOfLevels; i+=1)
            colors.push(`rgb(${
                Math.ceil(Math.random()*255)},${
                Math.ceil(Math.random()*255)},${
                Math.ceil(Math.random()*255)})`)

        function _createLayout(numberOfLevels, currentLevelItems) {
            var currentLevelLayoutNodes = []

            if (numberOfLevels > 0) {
                for (let i=0, len1=currentLevelItems.length; i<len1; i+=1) {
                    let currentItem = currentLevelItems[i]
                    let currentLevelLayoutNode = (new Node())
                        .setOrigin(0.5,0.5)
                        .setAlign(0,0)
                        .setMountPoint(0,0)
                        .setSizeMode('absolute', 'absolute')

                    /*
                     * TODO: Remove. These are temporary DOMElements to visualize
                     * the layout spaces, shared globally for the entry point to manipulate.
                     * Cards will be added externally.
                     */
                    let cardNode = scene.addChild(new Node)
                        .setOrigin(0.5,0.5)
                        .setAlign(0,0)
                        .setMountPoint(0,0)
                        .setSizeMode('absolute', 'absolute')
                        .setAbsoluteSize(self.columnWidth,self.rowHeight)
                        .setPosition(
                            Math.ceil(Math.random()*window.innerWidth*2),
                            Math.ceil(Math.random()*window.innerHeight*2),
                            Math.ceil(Math.random()*1000*2)
                        )
                        .setRotation(
                            Math.random()*Math.PI*2,
                            Math.random()*Math.PI*2,
                            Math.random()*Math.PI*2
                        )
                    let card = new DOMElement(cardNode, {
                        content: `<div style="width: 100%; height: 100%; border: 10px solid white; background: ${colors[numberOfLevels-1]}"></div>`
                    })
                    cards.push(cardNode)
                    cardNode.goToNode = currentLevelLayoutNode

                    //new DOMElement(currentLevelLayoutNode, {
                        //content: `<div style="width: 100%; height: 100%; border: 10px solid white; background: ${colors[numberOfLevels-1]}; opacity: 0.5"></div>`
                    //})

                    currentLevelLayoutNodes.push(currentLevelLayoutNode)

                    let childItems = self.childrenGetter(currentItem, numberOfLevels)
                    let childLayoutNodes = _createLayout(numberOfLevels-1, childItems)

                    for (let j=0, len2=childLayoutNodes.length; j<len2; j+=1) {
                        currentLevelLayoutNode.addChild(childLayoutNodes[j])
                    }

                    // Width and height are multiples of rowHeight and
                    // columnWidth respectively.
                    // TODO, spacing, etc.
                    let sizeX = 0

                    // Cards at level 1 and 2 are the base width.
                    if (numberOfLevels < 3) sizeX = self.columnWidth

                    // otherwise add the widths of the children.
                    else for (let j=0, len2=childLayoutNodes.length; j<len2; j+=1)
                        sizeX += childLayoutNodes[j].getAbsoluteSize()[0]

                    currentLevelLayoutNode.setAbsoluteSize(
                        // the width a multiple of columnWidth and at
                        // least one columnWidth.
                        sizeX,

                        // all nodes are just rowHeight for now.
                        self.rowHeight
                    )

                    let positionX = 0
                    let positionY = self.rowHeight

                    // only the first level is positioned at Y = 0
                    if (initialLevels-numberOfLevels === 0) positionY = 0

                    // place cells from left to right in each level.
                    if (i-1 >= 0) {
                        let previousSizeX = currentLevelLayoutNodes[i-1].getAbsoluteSize()[0]
                        let previousPositionX = currentLevelLayoutNodes[i-1].getPosition()[0]
                        positionX = previousPositionX + previousSizeX
                    }

                    // except in the last level stack cells
                    if (numberOfLevels == 1) {
                        positionX = 0
                        positionY = positionY + i * positionY
                    }

                    currentLevelLayoutNode.setPosition(
                        positionX, positionY, 0
                    )

                }
            }

            return currentLevelLayoutNodes
        }

        let rootLayoutNodes = _createLayout(numberOfLevels, this.rootItems)
        console.log('--------------- root layout nodes', rootLayoutNodes)

        for (let i=0, len=rootLayoutNodes.length; i<len; i+=1) {
            this.addChild(rootLayoutNodes[i])
        }
    }

    // set an array of items that are the roots of trees representing
    // the structure of the layout (the relationships of cards).
    setRootItems(roots) {
        this.rootItems = roots
    }

    // fn called as fn(item, level) where item is the current item
    // being layed out and level is the current level in the map
    // layout.
    // fn should return an array of children.
    setChildrenGetter(fn) {
        this.childrenGetter = fn
    }
}

this.UserStoryMapLayout = UserStoryMapLayout
