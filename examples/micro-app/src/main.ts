import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'

createApp(App).use(createRouter({
    history: createWebHistory(),
    routes: [{
        path: '/',
        component: ()=> import("@micro/shared/page")
    },{
        path: '/sub-app',
        component: ()=> import("@micro/sub-app").then(m=> m.WelcomePage)
    }]
})).mount('#app')
