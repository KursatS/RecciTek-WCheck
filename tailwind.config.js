/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./src/**/*.{html,ts,js}",
    ],
    theme: {
        extend: {
            colors: {
                'bg-dark': '#0f172a',
                'card-dark': 'rgba(30, 41, 59, 0.7)',
                'accent': '#38bdf8',
                'recci': '#10b981',
                'kvk': '#3b82f6',
            },
        },
    },
    plugins: [],
}
