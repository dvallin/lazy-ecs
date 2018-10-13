import { Pipe, Eval } from "lazy-space"
import { Entity } from "./entity"

export type Component = object

export interface EntityView {
    entity: Entity
    components: { [name: string]: Component }
}

export abstract class ComponentSource<C, T> extends Pipe<EntityView, T> {

    public constructor(
        public readonly components: C[],
        public readonly name: string
    ) {
        super()
    }

    protected abstract pass(entity: EntityView): Eval<T>
}
