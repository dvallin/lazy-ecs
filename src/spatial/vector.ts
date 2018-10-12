import { Lazy } from "lazy-space"

export class Vector {

    public key: () => string = Lazy.lazy(() => this.coordinates.join())

    private readonly coordinates: number[]

    public constructor(...coords: number[]) {
        this.coordinates = coords
    }

    public get dimensions(): number {
        return this.coordinates.length
    }

    public get x(): number {
        return this.coordinates[0]
    }

    public get y(): number {
        return this.coordinates[1]
    }

    public get z(): number {
        return this.coordinates[2]
    }

    public at(index: number): number {
        return this.coordinates[index]
    }
}
