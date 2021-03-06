export interface router extends disposable {
    (pattern: string): route
}

export interface disposable {
    dispose: finaliser
}

export interface finaliser {
    (): void
}

interface pathBuilder {
    (opt?: any): string
}

interface enterCallback {
    (params: any, nestedRouter: router, route: route): void
}

interface exitCallback {
    (params: any, route: route): void
}

interface fluientRoute {
    handleWith: (callback: (params: any, nestedRouter: router, route: route) => finaliser | void) => route
    onEnter: (callback: enterCallback) => route
    onExit: (callback: exitCallback) => route
}

interface privateRoute {
    enter: enterCallback[]
    exit: exitCallback[]
}


interface route extends pathBuilder, fluientRoute { }

interface pathProvider {
    (onPathChange: (path: string) => void): finaliser
}

function rankRouteMatch(path: string, pattern: string) {
    const weight = pattern.split('/').length
    const matcher = new RegExp(`^${pattern.replace(/:\w+/g, '\\w+')}$`)
    return matcher.test(path) ? weight : 0
}

export function createRouter(pathProvider: pathProvider, base?: string): router {
    interface routeMap { pattern: string, route: route, privateRoute: privateRoute }
    const routes: routeMap[] = []

    var currentPath: string = "/"
    var currentRouteMap: routeMap
    var nestedRouter

    var dispatchToHandler = (handler: enterCallback) => {
        handler({}, nestedRouter, currentRouteMap.route)
    }

    function getRouteMap(path: string) {
        const rankingFunction = ({pattern}) => rankRouteMatch(path, pattern)
        const bestMatch = routes.sort((a, b) => rankingFunction(a) - rankingFunction(b)).filter(a => rankingFunction(a) > 0)[0]
        return bestMatch
    }

    function updateRoute() {
        const routeMap = getRouteMap(currentPath)
        if (currentRouteMap === routeMap) {
            return
        }

        if (currentRouteMap) {
            currentRouteMap.privateRoute.exit.forEach(exit => exit({}, currentRouteMap.route))
        }

        currentRouteMap = routeMap


        if (currentRouteMap) {
            nestedRouter = createRouter(staticPath(currentPath), currentPath)
            const paramNames = currentRouteMap.pattern.match(/:\w+/g) || []
            const matcher = new RegExp(`^${currentRouteMap.pattern.replace(/:\w+/g, '(\\w+)')}$`)
            const paramValues = currentPath.match(matcher) || []
            const params = paramNames.reduce((acc, name, index) => {acc[name.replace(':', '')] = paramValues[index + 1]; return acc}, {}) 

            dispatchToHandler = (handler: enterCallback) => handler(params, nestedRouter, currentRouteMap.route)
            currentRouteMap.privateRoute.enter.forEach(dispatchToHandler)
        }
    }

    const unbindPathProvider = pathProvider((path: string) => {
        currentPath = path
        updateRoute()
    })

    const router = ((pattern: string) => {
        const route = ((opt = {}) => Object.keys(opt).reduce((acc, key) => acc.replace(':' + key, opt[key]), pattern)) as route
        const privateRoute: privateRoute = { enter: [], exit: [] }

        route.onEnter = (callback) => {
            privateRoute.enter.push(callback)
            if (route === (currentRouteMap && currentRouteMap.route)) {
                dispatchToHandler(callback)
            }
            return route
        }

        route.onExit = (callback => {
            privateRoute.exit.push(callback)
            return route
        })

        route.handleWith = (callback => {
            var finaliser: finaliser | null | void

            route
                .onEnter((params, router, route) => finaliser = callback(params, router, route))
                .onExit(() => {
                    if (finaliser) {
                        finaliser()
                        finaliser = null
                    }
                })
            return route
        })

        routes.push({ pattern, route, privateRoute })

        updateRoute()
        return route as route;
    }) as router

    router.dispose = () => {
        unbindPathProvider()
    }
    return router
}

export function staticPath(path: string): pathProvider {
    return (onChange) => {
        onChange(path)
        return () => { }
    }
}
