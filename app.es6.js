if (Meteor.isClient) {
    Meteor.startup(() => {

        // Famous dependencies
        let Engine         = famous.core.FamousEngine;
        let Camera         = famous.components.Camera
        let Transitionable = famous.transitions.Transitionable

        // just a node structure representing the map layout spaces.
        class MapNode {
            constructor() {
                this.children = []
                this.parent = null
            }
        }

        let mapNodeList = []
        function createRandomMapNodes(numberOfLevels) {
            let currentLevelNodes = []
            let numberOfNodesThisLevel = Math.ceil(Math.random() * 3)

            if (numberOfLevels > 0) {
                for (let i=0; i<numberOfNodesThisLevel; i+=1) {
                    let node = new MapNode()
                    currentLevelNodes.push(node)
                    mapNodeList.push(node)

                    let children = createRandomMapNodes(numberOfLevels - 1)
                    node.children = children
                }
            }
            return currentLevelNodes
        }

        Engine.init()
        let scene = Engine.createScene('.scene')
        this.scene = scene // share the scene across the app.

        // make some random map nodes to arrange
        let numberOfMapLevels = 6
        let userStoryMapRoots = createRandomMapNodes(numberOfMapLevels)

        var layout = new UserStoryMapLayout()
        layout.setRootItems(userStoryMapRoots)
        layout.setChildrenGetter(function(mapNode, level) {
            return mapNode.children
        })
        layout.createLayout(numberOfMapLevels)
        scene.addChild(layout)

        // TODO: use the real cards. For now the current sample they are added
        // inside the layout.
        console.log('number of cards:', cards.length)
        for (let i=0, len=cards.length; i<len; i+=1) {
            //let goToPosition = cards[i].goToNode.getPositionFrom(scene)
            //cards[i].setPosition(goToPosition[0],goToPosition[1],goToPosition[2])
            //console.log(cards[i].getPosition() === cards[i].goToNode.getPositionFrom(scene))
            console.log('position of node from scene', cards[i].goToNode.getPositionFrom(scene))
        }

        let cameraNode = scene.addChild()
        let camera = new Camera(cameraNode)
        camera.setDepth(1000)

        // animate the camera. TODO: This will be controlled with zoom...
        let camPositionZ = new Transitionable(0)
        ~function loop() {
            camPositionZ.to(10000, 'easeInOut', 6000).to(0, 'easeInOut', 6000, loop)
        }()

        let cameraAnimation = cameraNode.addComponent({
            onUpdate: function() {
                cameraNode.setPosition(0,0,camPositionZ.get())
                cameraNode.requestUpdateOnNextTick(cameraAnimation)
            }
        })
        cameraNode.requestUpdateOnNextTick(cameraAnimation)

    })
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
