if (Meteor.isClient) {
    Meteor.startup(() => {

        // Famous dependencies
        let Engine         = famous.core.FamousEngine;
        let Camera         = famous.components.Camera
        let Transitionable = famous.transitions.Transitionable
        let Position       = famous.components.Position
        let Rotation       = famous.components.Rotation
        let Size           = famous.components.Size

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
        let rotationPositionAnimations = []
        let sizeAnimations = []
        for (let i=0, len=cards.length; i<len; i+=1) {
            let card = cards[i]
            let goToPosition = card.goToNode.getPositionFrom(scene)
            let cardPosition = new Position(card)
            let cardRotation = new Rotation(card)

            let sizeTransition
            let sizeY
            let id

            if (card.goToNode.getAbsoluteSize()[0] !== card.getAbsoluteSize()[0]) {
                sizeTransition = new Transitionable(card.getAbsoluteSize()[0])
                sizeY = card.getAbsoluteSize()[1]

                id = card.addComponent({
                    onUpdate: () => {
                        card.setAbsoluteSize(sizeTransition.get(), sizeY, 0)
                        if (sizeTransition.isActive()) {
                            card.requestUpdateOnNextTick(id)
                        }
                    }
                })

                sizeAnimations.push(function(done) {
                    card.requestUpdateOnNextTick(id)

                    sizeTransition.set(card.goToNode.getAbsoluteSize()[0], {
                    //sizeTransition.set(2000, {
                        duration: 1000, curve: 'inOutExpo' }, done)
                })
            }

            rotationPositionAnimations.push((done) => {
                cardPosition.set(goToPosition[0],goToPosition[1],goToPosition[2]+10, {
                    duration: 2000,
                    curve: 'inOutExpo'
                }, done)
            })

            rotationPositionAnimations.push((done) => {
                cardRotation.set(0,0,0, {
                    duration: 2000,
                    curve: 'inOutExpo'
                }, done)
            })
        }

        //setTimeout(function() {
            //async.series([
                //(done) => {
                    async.parallel(rotationPositionAnimations/*, done*/)
                //},
                //(done) => {
                    async.parallel(sizeAnimations/*, done*/)
                //}
            //])
        //}, 3000)

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


        Engine.init()
    })
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
