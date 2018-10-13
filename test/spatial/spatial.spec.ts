import { DiscreteSpace, SubSpace, Vector, DiscreteStackedSpace, SubStackedSpace } from "../../src"
import { Some, None } from "lazy-space"

interface Tile {
    c: string
}

describe("Vector", () => {

    it("gives access to x, y and z", () => {
        const v = new Vector(0, 1, 2)
        expect(v.x).toEqual(0)
        expect(v.y).toEqual(1)
        expect(v.z).toEqual(2)
    })

    it("gives the dimension", () => {
        expect(new Vector().dimensions).toEqual(0)
        expect(new Vector(0).dimensions).toEqual(1)
        expect(new Vector(0, 1, 2).dimensions).toEqual(3)
    })

    it("gives random access", () => {
        expect(new Vector().at(3)).toEqual(undefined)
        expect(new Vector(0).at(0)).toEqual(0)
    })
})

describe("DiscreteSpace", () => {

    it("sets and gets values", () => {
        const space = new DiscreteSpace<Tile>()

        space.set(new Vector(2, 3), { c: "a" })
        expect(space.get(new Vector(2, 3))).toEqual(new Some({ c: "a" }))
    })

    it("overrides values", () => {
        const space = new DiscreteSpace<Tile>()

        space.set(new Vector(2, 3), { c: "a" })
        space.set(new Vector(2, 3), { c: "b" })
        expect(space.get(new Vector(2, 3))).toEqual(new Some({ c: "b" }))
    })

    it("removes values", () => {
        const space = new DiscreteSpace<Tile>()
        space.set(new Vector(2, 3), { c: "a" })
        space.remove(new Vector(2, 3))
        expect(space.get(new Vector(2, 3))).toEqual(new None())
    })
})

describe("SubStackedSpace", () => {

    it("sets and adds values", () => {
        const space = new DiscreteSpace<Tile>()
        const sub = new SubSpace(space, p => new Vector(p.x, 4))

        sub.set(new Vector(2, 3), { c: "a" })
        expect(sub.get(new Vector(2, 1))).toEqual(new Some({ c: "a" }))
    })

    it("overrides values", () => {
        const space = new DiscreteSpace<Tile>()
        const sub = new SubSpace(space, p => new Vector(p.x, 4))

        sub.set(new Vector(2, 6), { c: "a" })
        sub.set(new Vector(2, 3), { c: "b" })
        expect(sub.get(new Vector(2, 1))).toEqual(new Some({ c: "b" }))
    })

    it("removes values", () => {
        const space = new DiscreteSpace<Tile>()
        const sub = new SubSpace(space, p => new Vector(p.x, 4))

        sub.set(new Vector(2, 7), { c: "a" })
        sub.remove(new Vector(2, 3))
        expect(sub.get(new Vector(2))).toEqual(new None())
    })
})


describe("DiscreteStackedSpace", () => {

    it("sets and gets values", () => {
        const space = new DiscreteStackedSpace<Tile>()

        space.set(new Vector(2, 3), [{ c: "a" }])
        expect(space.get(new Vector(2, 3))).toEqual([{ c: "a" }])
    })

    it("adds values", () => {
        const space = new DiscreteStackedSpace<Tile>()

        space.add(new Vector(2, 3), { c: "a" })
        space.add(new Vector(2, 3), { c: "b" })
        expect(space.get(new Vector(2, 3))).toEqual([{ c: "a" }, { c: "b" }])
    })

    it("removes values", () => {
        const space = new DiscreteStackedSpace<Tile>()
        space.set(new Vector(2, 3), [{ c: "a" }])
        space.add(new Vector(2, 3), { c: "b" })

        space.retain(new Vector(2, 3), t => t.c !== "a")
        expect(space.get(new Vector(2, 3))).toEqual([{ c: "b" }])
    })
})

describe("SubStackedSpace", () => {

    it("sets and adds values", () => {
        const space = new DiscreteStackedSpace<Tile>()
        const sub = new SubStackedSpace(space, p => new Vector(p.x, 4))

        sub.set(new Vector(2, 3), [{ c: "a" }])
        expect(sub.get(new Vector(2, 1))).toEqual([{ c: "a" }])
    })

    it("adds values", () => {
        const space = new DiscreteStackedSpace<Tile>()
        const sub = new SubStackedSpace(space, p => new Vector(p.x, 4))

        sub.add(new Vector(2, 6), { c: "a" })
        sub.add(new Vector(2, 3), { c: "b" })
        expect(sub.get(new Vector(2, 1))).toEqual([{ c: "a" }, { c: "b" }])
    })

    it("removes values", () => {
        const space = new DiscreteStackedSpace<Tile>()
        const sub = new SubStackedSpace(space, p => new Vector(p.x, 4))

        sub.set(new Vector(2), [{ c: "a" }])
        sub.add(new Vector(2, 3), { c: "b" })

        sub.retain(new Vector(2), t => t.c !== "a")
        expect(sub.get(new Vector(2))).toEqual([{ c: "b" }])
    })
})
