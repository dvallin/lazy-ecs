import { Vector } from "./Vector"
import { Option } from "lazy-space"

export interface Space<A> {
    get(pos: Vector): Option<A>
    set(pos: Vector, objects: A): void
    remove(pos: Vector): Option<A>
}

export class DiscreteSpace<A> implements Space<A> {

    private readonly objects: Map<string, A> = new Map()

    public get(pos: Vector): Option<A> {
        const key = pos.key()
        return Option.of(this.objects.get(key))
    }

    public set(pos: Vector, objects: A): void {
        const key = pos.key()
        this.objects.set(key, objects)
    }

    public remove(pos: Vector): Option<A> {
        const key = pos.key()
        const value = Option.of(this.objects.get(key))
        this.objects.delete(key)
        return value
    }
}

export class SubSpace<A> implements Space<A> {

    public constructor(
        public readonly space: Space<A>,
        public readonly transform: (pos: Vector) => Vector
    ) { }

    public get(pos: Vector): Option<A> {
        return this.space.get(this.transform(pos))
    }

    public set(pos: Vector, objects: A): void {
        return this.space.set(this.transform(pos), objects)
    }

    public remove(pos: Vector): Option<A> {
        return this.space.remove(this.transform(pos))
    }
}
