import { Vector } from "./vector"

export interface StackedSpace<A> {
    get(pos: Vector): A[]
    set(pos: Vector, objects: A[]): void

    add(pos: Vector, object: A): void
    retain(pos: Vector, predicate: (a: A) => boolean): void
}

export class DiscreteStackedSpace<A> implements StackedSpace<A> {

    private readonly objects: Map<string, A[]> = new Map()

    public get(pos: Vector): A[] {
        const key = pos.key()
        return this.objects.get(key) || []
    }

    public set(pos: Vector, objects: A[]): void {
        const key = pos.key()
        this.objects.set(key, objects)
    }

    public add(pos: Vector, object: A): void {
        const key = pos.key()
        const objects = this.objects.get(key) || []
        objects.push(object)
        this.objects.set(key, objects)
    }

    public retain(pos: Vector, predicate: (a: A) => boolean): void {
        const key = pos.key()
        const objects = this.objects.get(key) || []
        this.objects.set(key, objects.filter(o => predicate(o)))
    }
}

export class SubStackedSpace<A> implements StackedSpace<A> {

    public constructor(
        public readonly space: StackedSpace<A>,
        public readonly transform: (pos: Vector) => Vector
    ) { }

    public get(pos: Vector): A[] {
        return this.space.get(this.transform(pos))
    }

    public set(pos: Vector, objects: A[]): void {
        return this.space.set(this.transform(pos), objects)
    }

    public add(pos: Vector, object: A): void {
        return this.space.add(this.transform(pos), object)
    }

    public retain(pos: Vector, predicate: (a: A) => boolean): void {
        return this.space.retain(this.transform(pos), predicate)
    }
}
