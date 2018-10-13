import { World, Vector, Entity, ComponentSource, DenseStorage, SparseStorage, EntityView } from "../../src"
import { Merge, Push, Eval, TryEval, Option, Stream } from "lazy-space"

type Components = "position" | "active" | "room"

type ActivePositionView = Vector
class ActivePosition extends ComponentSource<Components, ActivePositionView> {

    public constructor() {
        super(["position", "active"], "activePosition")
    }

    public pass(e: EntityView): Eval<ActivePositionView> {
        return new TryEval(() => e.components.position as Vector)
    }
}

type AllPositionView = EntityView
class AllPositions extends ComponentSource<Components, AllPositionView> {

    public constructor() {
        super(["position"], "allPositions")
    }

    public pass(e: EntityView): Eval<AllPositionView> {
        return new TryEval(() => e)
    }
}

type AllRoomsView = EntityView
class AllRooms extends ComponentSource<Components, AllRoomsView> {

    public constructor() {
        super(["room"], "allRooms")
    }

    public pass(e: EntityView): Eval<AllRoomsView> {
        return new TryEval(() => e)
    }
}

type ActiveRoomView = EntityView
class ActiveRoom extends Merge<ActivePositionView, AllRoomsView, ActiveRoomView> {

    public merge(): Option<Eval<ActiveRoomView>> {
        return this.left.flatMap(l => this.right
            .filter(r => {
                const roomPosition = r.components.room as Vector
                return l.key() === roomPosition.key()
            })
            .map(e => new TryEval(() => e))
        )
    }
}

describe("Pipeline Execution", () => {
    let world: World<Components>
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
            push(p: S): Eval<void> {
                logFn(f(p))
                return Eval.noop()
            }
        }
    }
})
