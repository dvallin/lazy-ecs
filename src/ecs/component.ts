import { Pipe } from "../pipeline/pipe"
import { Entity } from "./entity"

export type Component = object

export interface EntityView {
    entity: Entity
    components: { [name: string]: Component }
}

export abstract class ComponentSource<T> extends Pipe<EntityView, T> {

    public constructor(
        public readonly components: string[],
        public readonly name: string
    ) {
        super()
    }

    protected abstract pass(entity: EntityView): T
}
