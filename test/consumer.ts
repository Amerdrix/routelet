import { createRouter, staticPath, router } from '../src/routelet'



interface component {
    (params: any, router: router)
}
interface id {
    id: number
}


const router = createRouter(staticPath("/user/5/profile"))

function appRoot(params: any, router: router) {
    const buildUserPath = router("/user/:id")
        .onEnter(user)

    buildUserPath()
}

const user: component = (params: any, router: router) => {
    const profilePath = router("/profile")
        .handleWith(userProfile(params))

    const postsPath = router("/posts")
        .handleWith(userPosts(params))

    profilePath()
}

const userProfile = ({id}: id): component => (params, router) => {
    console.log('enter profile:', id)
    return () => { console.log('exit profile:', id) }
}


const userPosts = ({id}: id): component => (params, router) => {
    console.log('enter post for user:', id)
    return () => { console.log('exit post for user:', id) }
}