import { Source, Push } from "./elements"
import { Stream } from "lazy-space"

export abstract class Pipe<I, O> implements Push<I>, Source<O> {

    public constructor(
        protected readonly subscriptions: Set<Push<O>> = new Set()
    ) { }

    public push(input: I): Stream<void> {
        return Stream.of([() => this.pass(input)], Stream.directStream)
            .flatMap(output => Stream
                .iterator(this.subscriptions.values())
                .flatMap(s => s.push(output))
            )
    }

    public subscribe(p: Push<O>): void {
        this.subscriptions.add(p)
    }

    protected abstract pass(input: I): O
}
