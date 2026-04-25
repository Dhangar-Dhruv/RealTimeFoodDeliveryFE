import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                menu: resolve(__dirname, 'menu.html'),
                restaurant: resolve(__dirname, 'restaurant.html'),
                cart: resolve(__dirname, 'cart.html'),
                checkout: resolve(__dirname, 'checkout.html'),
                orders: resolve(__dirname, 'orders.html'),
                profile: resolve(__dirname, 'profile.html'),
                login: resolve(__dirname, 'login.html'),
            }
        }
    }
})
