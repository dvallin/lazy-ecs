import { PromiseSource, MouseEventSource, KeyboardEventSource, TouchEventSource } from "../../src"
import { pushOf, Eval } from "lazy-space"

describe("Sources", () => {

    const mock = jest.fn()
    const mockPush = pushOf(i => {
        mock(i)
        return Eval.noop()
    })

    beforeEach(() => {
        jest.resetAllMocks()
    })

    describe("PromiseSource", () => {

        it("pushes promises", async () => {
            const source = new PromiseSource()
            source.subscribe(mockPush)

            const promise = new Promise(resolve => resolve("test"))
            source.registerPromise(promise)
            await promise

            expect(mock).toHaveBeenCalledWith("test")
        })
    })

    describe("KeyboardEventSource", () => {

        it("pushes events it has subscribed to", () => {
            const source = new KeyboardEventSource("keydown")
            source.subscribe(mockPush)

            document.dispatchEvent(new KeyboardEvent("keydown"))

            expect(mock).toHaveBeenCalledTimes(1)
            expect(mock.mock.calls[0][0].type).toEqual("keydown")
        })

        it("does not push events it has not subscribed to", () => {
            const source = new KeyboardEventSource("keydown")
            source.subscribe(mockPush)

            document.dispatchEvent(new KeyboardEvent("keyup"))

            expect(mock).toHaveBeenCalledTimes(0)
        })
    })

    describe("MouseEventSource", () => {

        it("pushes events it has subscribed to", () => {
            const source = new MouseEventSource("click", "mousedown")
            source.subscribe(mockPush)

            document.dispatchEvent(new MouseEvent("click"))

            expect(mock).toHaveBeenCalledTimes(1)
            expect(mock.mock.calls[0][0].type).toEqual("click")
        })

        it("does not push events it has not subscribed to", () => {
            const source = new MouseEventSource("click", "mousedown")
            source.subscribe(mockPush)

            document.dispatchEvent(new MouseEvent("mouseup"))

            expect(mock).toHaveBeenCalledTimes(0)
        })
    })

    describe("TouchEventSource", () => {

        it("pushes events it has subscribed to", () => {
            const source = new TouchEventSource("touchstart")
            source.subscribe(mockPush)

            document.dispatchEvent(new TouchEvent("touchstart"))

            expect(mock).toHaveBeenCalledTimes(1)
            expect(mock.mock.calls[0][0].type).toEqual("touchstart")
        })

        it("does not push events it has not subscribed to", () => {
            const source = new TouchEventSource("touchstart")
            source.subscribe(mockPush)

            document.dispatchEvent(new TouchEvent("touchend"))

            expect(mock).toHaveBeenCalledTimes(0)
        })
    })
})
