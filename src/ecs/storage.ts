import { Entity } from "./entity"
import { Component } from "./component"

import { Option, Stream } from "lazy-space"

export interface Storage<A extends Component> {

    set(id: Entity, component: A): Storage<A>
    remove(id: Entity): Storage<A>
    get(id: Entity): Option<A>
    has(id: Entity): boolean
    entities(): Stream<Entity>
}

export class SparseStorage<A extends Component> implements Storage<A> {

    private readonly data: Map<Entity, A> = new Map()

    public set(id: Entity, component: A): Storage<A> {
        this.data.set(id, component)
        return this
    }

    public remove(id: Entity): Storage<A> {
        this.data.delete(id)
        return this
    }

    public get(id: Entity): Option<A> {
        return Option.of(this.data.get(id))
    }

    public has(id: Entity): boolean {
        return this.data.has(id)
    }

    public entities(): Stream<Entity> {
        return Stream.iterator(this.data.keys())
    }
}

export class DenseStorage<A extends Component> implements Storage<A> {

    private readonly data: (A | undefined)[] = []

    public set(id: Entity, component: A): Storage<A> {
        this.data[id] = component
        return this
    }

    public remove(id: Entity): Storage<A> {
        this.data[id] = undefined
        return this
    }

    public get(id: Entity): Option<A> {
        return Option.of(this.data[id])
    }

    public has(id: Entity): boolean {
        return this.data[id] !== undefined
    }

    public entities(): Stream<Entity> {
        return Stream.interval(0, this.data.length - 1).filter(id => this.has(id))
    }
}
