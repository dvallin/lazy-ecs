import { Storage } from "./storage"
import { Component, ComponentSource, EntityView } from "./component"
import { EntityModifier, Entity } from "./entity"

import { Option, Stream, None, Some, Eval, Empty } from "lazy-space"

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

    public fetchEntities(storages: string[]): Stream<EntityView> {
        if (storages.length === 0) {
            return new Empty()
        }
        return this.getStorage(storages[0])
            .toStream()
            .flatMap(s => s.entities())
            .map(entity => this.fetchEntity(entity, ...storages))
            .filter(e => e.isPresent())
            .map(e => e.get(undefined)!)
    }

    public tick(): Stream<Eval<void>> {
        return Stream
            .iterator(this.componentSources.values())
            .flatMap(source => this.fetchEntities(source.components)
                .map(e => source.push(e))
            )
    }
}
