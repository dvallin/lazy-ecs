import { Option, None, Stream, Try } from "lazy-space"
import { Push2, Source, pushOf, Push } from "./elements"

export abstract class Merge<L, R, T> implements Push2<L, R>, Source<T> {

    public constructor(
        protected left: Option<L> = new None(),
        protected right: Option<R> = new None(),
        protected readonly subscriptions: Set<Push<T>> = new Set()
    ) {
    }

    public get pushL(): Push<L> {
        return pushOf(i => {
            this.left = Option.of(i)
            return this.tryPush()
        })
    }
    public get pushR(): Push<R> {
        return pushOf(i => {
            this.right = Option.of(i)
            return this.tryPush()
        })
    }

    public subscribe(p: Push<T>): void {
        this.subscriptions.add(p)
    }

    protected abstract merge(): Try<T>

    private tryPush(): Stream<void> {
        const t = this.merge()
        if (t.isSuccess()) {
            this.reset()
        }
        return t.map(o => Stream
            .iterator(this.subscriptions.values())
            .flatMap(s => s.push(o)))
            .recover(() => Stream.just([]))
    }

    private reset(): void {
        this.left = new None()
        this.right = new None()
    }
}
