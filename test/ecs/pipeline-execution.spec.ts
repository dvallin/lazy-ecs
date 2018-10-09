import { World, Entity, ComponentSource, DenseStorage, SparseStorage, EntityView } from "../../src/ecs"
import { Vector } from "../../src/spatial"
import { Merge, Push } from "../../src/pipeline"
import { Failure, Success, Try, Stream } from "lazy-space"

type ActivePositionView = Vector
class ActivePosition extends ComponentSource<ActivePositionView> {

    public constructor() {
        super(["position", "active"], "activePosition")
    }

    public pass(e: EntityView): ActivePositionView {
        return e.components.position as ActivePositionView
    }
}

type AllPositionView = EntityView
class AllPositions extends ComponentSource<AllPositionView> {

    public constructor() {
        super(["position"], "allPositions")
    }

    public pass(e: EntityView): AllPositionView {
        return e
    }
}

type AllRoomsView = EntityView
class AllRooms extends ComponentSource<AllRoomsView> {

    public constructor() {
        super(["room"], "allRooms")
    }

    public pass(e: EntityView): AllRoomsView {
        return e
    }
}

type ActiveRoomView = EntityView
class ActiveRoom extends Merge<ActivePositionView, AllRoomsView, ActiveRoomView> {

    public merge(): Try<ActiveRoomView> {
        return this.left.flatMap(l => this.right
            .filter(r => {
                const roomPosition = r.components.room as Vector
                return l.key() === roomPosition.key()
            })
            .map(r => new Success<ActiveRoomView, Error>(r))
        ).orElse(() => new Failure(new Error()))
    }
}

describe("Pipeline Execution", () => {
    let world: World
    let inactive: Entity
    let active: Entity
    let room: Entity

    const logFn = jest.fn()

    beforeEach(() => {
        jest.resetAllMocks()

        world = new World()
        world.registerComponent("room", new SparseStorage<Vector>())
        world.registerComponent("position", new DenseStorage<Vector>())
        world.registerComponent("active", new SparseStorage<Vector>())
        room = world.createEntity()
            .withComponent("room", new Vector(0, 1))
            .entity
        inactive = world.createEntity()
            .withComponent("position", new Vector(1, 1))
            .entity
        active = world.createEntity()
            .withComponent("position", new Vector(0, 1))
            .withComponent("active", {})
            .entity
    })

    it("fetches from a single component", () => {
        const allRoomSystem = new AllRooms()
        allRoomSystem.subscribe(logger(s => s.entity))

        world.registerComponentSource(allRoomSystem)
        Stream.evaluate(world.tick())

        expect(logFn).toHaveBeenCalledTimes(1)
        expect(logFn).toHaveBeenCalledWith(room)
    })

    it("iterates over all entities matching the component", () => {
        const allPositions = new AllPositions()
        allPositions.subscribe(logger(s => s.entity))

        world.registerComponentSource(allPositions)
        Stream.evaluate(world.tick())

        expect(logFn).toHaveBeenCalledTimes(2)
        expect(logFn).toHaveBeenCalledWith(active)
        expect(logFn).toHaveBeenCalledWith(inactive)
    })

    it("fetches from multiple components", () => {
        const activePosition = new ActivePosition()
        activePosition.subscribe(logger(s => s.key()))

        world.registerComponentSource(activePosition)
        Stream.evaluate(world.tick())

        expect(logFn).toHaveBeenCalledTimes(1)
        expect(logFn).toHaveBeenCalledWith("0,1")
    })

    it("can merge sources", () => {
        const activePosition = new ActivePosition()
        const allRooms = new AllRooms()

        const activeRoom = new ActiveRoom()
        activePosition.subscribe(activeRoom.pushL)
        allRooms.subscribe(activeRoom.pushR)
        activeRoom.subscribe(logger(e => e.entity))

        world.registerComponentSource(activePosition)
        world.registerComponentSource(allRooms)
        Stream.evaluate(world.tick())

        expect(logFn).toHaveBeenCalledTimes(1)
        expect(logFn).toHaveBeenCalledWith(room)
    })

    function logger<S, T>(f: (i: S) => T): Push<S> {
        return {
            push(p: S): Stream<void> {
                return Stream.of([() => logFn(f(p))])
            }
        }
    }
})
