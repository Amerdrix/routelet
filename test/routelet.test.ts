import { createRouter, staticPath, router, finaliser } from '../src/routelet'

import { expect } from 'chai'


var changePath: (string) => () => void
const pathProvider = (onChange) => {
    changePath = onChange;
    return () => { }
}

describe("createRouter", () => {

    it("does not throw", () => {
        expect(() => createRouter(pathProvider)).to.not.throw(Error)
    })

    it("returns a router", () => {
        expect(createRouter(pathProvider)).to.not.be.null
    })
})

describe("a router", () => {
    var router: router = createRouter(pathProvider)

    beforeEach(() => {
        router = createRouter(pathProvider)
    })

    describe("path building", () => {
        it("returns a non parameterised route without modification", () => {
            const builder = router("/user")
            expect(builder()).to.eql("/user")
        })

        it("inserts parameterised route values", () => {
            const builder = router("/user/:id/:name")
            expect(builder({ id: 5, name: 'bob' })).to.eq("/user/5/bob")
        })
    })

    describe("onEnter", () => {
        it("is not called when the path changes to a non match", () => {
            var count = 0
            const route = router("/user")
            route.onEnter(() => {
                count++
            })

            changePath("/user2")
            expect(count).to.eq(0)
        })

        it("is called once when the path changes to a match", () => {
            var count = 0
            const route = router("/user")
            route.onEnter(() => {
                count++
            })

            changePath("/user")
            expect(count).to.eq(1)
        })

        it("is called when the path already matches", () => {
            var count = 0
            changePath("/user")

            const route = router("/user")
            route.onEnter(() => {
                count++
            })

            expect(count).to.eq(1)
        })
    })

    describe("onExit", () => {
        it("is not called when the path leaves a different route", () => {
            var count = 0
            changePath("/user2")

            const route = router("/user")
            route.onExit(() => {
                count++
            })

            changePath("/user")

            expect(count).to.eq(0)
        })

        it("is called when the path leaves", () => {
            var count = 0
            changePath("/user")

            const route = router("/user")
            route.onExit(() => {
                count++
            })

            changePath("/user2")

            expect(count).to.eq(1)
        })
    })

    describe("handleWith", () => {
        it("is not called when the path changes to a non match", () => {
            var count = 0
            const route = router("/user")
            route.handleWith(() => {
                count++
            })

            changePath("/user2")
            expect(count).to.eq(0)
        })

        it("is called once when the path changes to a match", () => {
            var count = 0
            const route = router("/user")
            route.handleWith(() => {
                count++
            })

            changePath("/user")
            expect(count).to.eq(1)
        })
        describe("the finaliser", () => {
            it("is not called when the path changes to a match", () => {
                var count = 0
                const route = router("/user")
                route.handleWith(() => {
                    return () => {
                        count++
                    }
                })

                changePath("/user")
                expect(count).to.eq(0)
            })
            it("is called when the path leaves a match", () => {
                var count = 0
                const route = router("/user")
                changePath("/user")
                route.handleWith(() => {
                    return () => {
                        count++
                    }
                })

                changePath("/user2")
                expect(count).to.eq(1)
            })
        })

    })



})