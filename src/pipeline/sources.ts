import { Source, Push } from "lazy-space"

export abstract class CallbackSource<T> implements Source<T> {

    public constructor(
        protected readonly subscriptions: Set<Push<T>> = new Set()
    ) { }

    public subscribe(p: Push<T>): void {
        this.subscriptions.add(p)
    }

    protected push(output: T): void {
        this.subscriptions.forEach(s => s.push(output))
    }
}

export class PromiseSource<T> extends CallbackSource<T> {

    public constructor() {
        super()
    }

    public registerPromise(promise: Promise<T>): void {
        promise.then(v => this.push(v))
    }
}

export type KeyboardEventType = "keydown" | "keypress" | "keyup"
export class KeyboardEventSource extends CallbackSource<KeyboardEvent> {

    public constructor(...types: KeyboardEventType[]) {
        super()
        types.map(type =>
            document.addEventListener(type, (e: KeyboardEvent) => this.push(e))
        )
    }
}

export type MouseEventType = "click" | "dblclick" | "mousedown" | "mouseup" | "mouseover" | "mouseout" | "mousemove"
export class MouseEventSource extends CallbackSource<MouseEvent> {

    public constructor(...types: MouseEventType[]) {
        super()
        types.map(type =>
            document.addEventListener(type, (e: MouseEvent) => this.push(e))
        )
    }
}

export type TouchEventType = "touchstart" | "touchend" | "touchmove" | "touchcancel"
export class TouchEventSource extends CallbackSource<TouchEvent> {

    public constructor(...types: TouchEventType[]) {
        super()
        types.map(type =>
            document.addEventListener(type, (e: TouchEvent) => this.push(e))
        )
    }
}
