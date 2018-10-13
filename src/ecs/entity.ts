import { World } from "./world"
import { Component } from "./component"

import { Stream } from "lazy-space"

export type Entity = number

export class EntityModifier<C extends string> {

    public constructor(
        private readonly world: World<C>,
        public readonly entity: Entity
    ) { }

    public withComponent<A extends Component>(name: C, component: A): EntityModifier<C> {
        this.world.getStorage<A>(name).map(s => s.set(this.entity, component))
        return this
    }

    public removeComponent<A extends Component>(name: C): EntityModifier<C> {
        this.world.getStorage<A>(name)
            .filter(s => s !== undefined)
            .map(s => s.remove(this.entity))
        return this
    }

    public delete(): void {
        Stream.evaluate(this.world.allStorages().map(s => s.remove(this.entity)))
    }
}
