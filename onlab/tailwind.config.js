/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#0f172a', // Slate 900
                secondary: '#2563eb', // Blue 600
                accent: '#ef4444', // Red 500
                light: '#f8fafc', // Slate 50
                dark: '#1e293b', // Slate 800
                success: '#10b981', // Emerald 500
                warning: '#f59e0b', // Amber 500
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            backgroundImage: {
                'hero-pattern': "linear-gradient(to right bottom, rgba(37, 99, 235, 0.05), rgba(255, 255, 255, 0))",
            }
        },
    },
    plugins: [],
}
