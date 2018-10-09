import { Storage } from "./storage"
import { Component, ComponentSource, EntityView } from "./component"
import { EntityModifier, Entity } from "./entity"

import { Option, Stream, None, Some } from "lazy-space"

export class World {

    private components: Map<string, Storage<Component>> = new Map()
    private componentSources: Map<string, ComponentSource<{}>> = new Map()

    private openEntities: Set<Entity> = new Set()
    private lastEntity: Entity = -1

    public registerComponent<A extends Component>(name: string, storage: Storage<A>): void {
        this.components.set(name, storage)
    }

    public registerComponentSource<T>(source: ComponentSource<T>): void {
        this.componentSources.set(source.name, source)
    }

    public getStorage<A extends Component>(name: string): Option<Storage<A>> {
        return Option.of(this.components.get(name) as Storage<A>)
    }

    public allStorages(): Stream<Storage<Component>> {
        return Stream.iterator(this.components.values())
    }

    public createEntity(): EntityModifier {
        let entity
        if (this.openEntities.size > 0) {
            entity = this.openEntities.values().next().value
            this.openEntities.delete(entity)
        } else {
            entity = ++this.lastEntity
        }
        return new EntityModifier(this, entity)
    }

    public editEntity(entity: Entity): EntityModifier {
        return new EntityModifier(this, entity)
    }

    public deleteEntity(entity: Entity): void {
        this.editEntity(entity).delete()
        this.openEntities.add(entity)
    }

    public fetchEntity(entity: Entity, ...storages: string[]): Option<EntityView> {
        const components: { [name: string]: Component } = {}
        for (const storage of storages) {
            const s = this.getStorage(storage).get(undefined)!
            const componentValue = s.get(entity).get(undefined)
            if (componentValue === undefined) {
                return new None()
            }
            components[storage] = componentValue
        }
        return new Some({ entity, components })
    }

    public tick(): Stream<void> {
        return Stream
            .interval(0, this.lastEntity)
            .filter(e => !this.openEntities.has(e))
            .flatMap(e => Stream
                .iterator(this.componentSources.values())
                .flatMap(source => this
                    .fetchEntity(e, ...source.components)
                    .map(entity => source.push(entity))
                    .get(Stream.just([]))
                )
            )
    }


}

