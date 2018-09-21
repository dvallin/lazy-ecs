import { Option, Some, None } from "@/option"
import { lazy } from "@/lazy/lazy"

export type Predicate<A> = (a: A) => boolean
export type Accumulator<A, B> = (accumulate: B, result: A) => B
export type LazyAccumulator<A, B> = (result: A, accumulate: () => B) => B

export interface Stream<A> {

    head(): Option<A>
    tail(): Option<Stream<A>>

    take(n: number): Stream<A>
    drop(n: number): Stream<A>
    takeWhile(f: Predicate<A>): Stream<A>
    dropWhile(f: Predicate<A>): Stream<A>

    fold<B>(initial: B, f: Accumulator<A, B>): B
    foldRight<B>(initial: () => B, combine: LazyAccumulator<A, B>): B

    map<B>(f: (a: A) => B): Stream<B>
    filter(f: (a: A) => boolean): Stream<A>
    filterMap<B>(f: (a: A) => Option<B>): Stream<B>
    flatMap<B>(f: (a: A) => Stream<B>): Stream<B>
    append(other: () => Stream<A>): Stream<A>

    exists(f: Predicate<A>): boolean
    all(f: Predicate<A>): boolean

    evaluate(): A[]
}

class Empty<A> implements Stream<A> {

    public head(): Option<A> {
        return new None()
    }

    public tail(): Option<Stream<A>> {
        return new None()
    }

    public take(): Empty<A> {
        return this
    }

    public drop(): Empty<A> {
        return this
    }

    public takeWhile(): Empty<A> {
        return this
    }

    public dropWhile(): Empty<A> {
        return this
    }

    public fold<B>(initial: B): B {
        return initial
    }

    public foldRight<B>(initial: () => B): B {
        return initial()
    }

    public map<B>(): Empty<B> {
        return new Empty()
    }

    public filter(): Empty<A> {
        return new Empty()
    }

    public filterMap<B>(): Empty<B> {
        return new Empty()
    }

    public flatMap<B>(): Empty<B> {
        return new Empty()
    }

    public append<B>(other: () => Stream<B>): Stream<B> {
        return other()
    }

    public exists(): boolean {
        return false
    }

    public all(): boolean {
        return true
    }

    public evaluate(): A[] {
        return []
    }
}

class Cons<A> implements Stream<A> {

    constructor(
        readonly _head: () => A,
        readonly _tail: () => Stream<A>
    ) { }

    public head(): Option<A> {
        return new Some(this._head())
    }

    public tail(): Option<Stream<A>> {
        return new Some(this._tail())
    }

    public take(n: number): Stream<A> {
        if (n > 0) {
            return new Cons(this._head, () => this._tail().take(n - 1))
        }
        return new Empty()
    }

    public drop(n: number): Stream<A> {
        if (n > 0) {
            return this._tail().drop(n - 1)
        }
        return this
    }

    public takeWhile(f: Predicate<A>): Stream<A> {
        if (f(this._head())) {
            return new Cons(this._head, () => this._tail().takeWhile(f))
        }
        return new Empty()
    }

    public dropWhile(f: Predicate<A>): Stream<A> {
        if (f(this._head())) {
            return this._tail().dropWhile(f)
        }
        return this
    }

    public fold<B>(initial: B, combine: Accumulator<A, B>): B {
        const accumulate = combine(initial, this._head())
        return this._tail().fold(accumulate, combine)
    }

    public foldRight<B>(initial: () => B, combine: LazyAccumulator<A, B>): B {
        return combine(this._head(), () => this._tail().foldRight(initial, combine))
    }

    public map<B>(f: (a: A) => B): Stream<B> {
        return new Cons(() => f(this._head()), () => this._tail().map(f))
    }

    public filter(f: (a: A) => boolean): Stream<A> {
        if (f(this._head())) {
            return new Cons(this._head, () => this._tail().filter(f))
        }
        return this._tail().filter(f)
    }

    public filterMap<B>(f: (a: A) => Option<B>): Stream<B> {
        const value = f(this._head()).get(undefined)
        if (value !== undefined) {
            return new Cons(() => value, () => this._tail().filterMap(f))
        }
        return this._tail().filterMap(f)
    }

    public flatMap<B>(f: (a: A) => Stream<B>): Stream<B> {
        return this.foldRight(() => new Empty() as Stream<B>, (head, tail) => f(head).append(tail))
    }

    public append(other: () => Stream<A>): Stream<A> {
        return this.foldRight(other, (head, tail) => new Cons(() => head, tail))
    }

    public exists(f: Predicate<A>): boolean {
        return this.foldRight(() => false, (result, accumulate) => f(result) || accumulate())
    }

    public all(f: Predicate<A>): boolean {
        return this.foldRight(() => true, (result, accumulate) => f(result) && accumulate())
    }

    public evaluate(): A[] {
        const initial: A[] = []
        return this.fold(initial, (accumulate, result) => {
            accumulate.push(result)
            return accumulate
        })
    }
}

export function cachedStream<A>(head: () => A, tail: () => Stream<A>): Stream<A> {
    return new Cons(lazy(head), lazy(tail))
}

export function directStream<A>(head: () => A, tail: () => Stream<A>): Stream<A> {
    return new Cons(head, tail)
}

export function of<A>(
    values: (() => A)[],
    streamConstructor: (head: () => A, tail: () => Stream<A>) => Stream<A> = cachedStream
): Stream<A> {
    if (values.length === 0) {
        return new Empty()
    }
    return streamConstructor(values[0], () => of(values.slice(1)))
}

export function just<A>(values: A[]): Stream<A> {
    return of(values.map(a => () => a), directStream)
}

export function constant(c: number = 1): Stream<number> {
    return unfold(c, (state) => new Some({ value: state, state }))
}

export function natural(start: number = 1): Stream<number> {
    return unfold(start, (state) => new Some({ value: state, state: state + 1 }))
}

export function interval(from: number, to: number): Stream<number> {
    return natural(from).take(to - from + 1)
}

export function fib(a0: number = 0, a1: number = 1): Stream<number> {
    return unfold({ a0, a1 }, (state) => {
        const a2 = state.a0 + state.a1
        return new Some({
            value: state.a0,
            state: { a0: state.a1, a1: a2 }
        })
    })
}

export function unfold<A, S>(currentState: S, f: (state: S) => Option<{ value: A, state: S }>): Stream<A> {
    const current = f(currentState).get(undefined)
    if (current !== undefined) {
        return directStream(() => current.value, () => unfold(current.state, f))
    }
    return new Empty()
}

export function iterator<A>(iter: IterableIterator<A>): Stream<A> {
    return unfold({}, () => {
        const next = iter.next()
        if (next.done) {
            return new None()
        } else {
            return new Some({
                value: next.value,
                state: {}
            })
        }
    })
}