/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Цвета из theme.css и index.css после консолидации
        'theme-primary': 'var(--color-primary-base, #48bb78)', // Пример с fallback
        'theme-secondary': 'var(--theme-secondary, #44b340)',
        'theme-success': 'var(--color-success-base, #44b340)',
        'theme-danger': 'var(--color-danger-base, #c03947)',
        'theme-info': 'var(--color-info-base, #2196F3)',
        'theme-light': 'var(--color-neutral-0, #e9f5f9)', // или --color-neutral-130 для светлой темы
        'theme-dark': 'var(--color-neutral-130, #1a202c)', // или --color-neutral-0 для светлой темы
        'theme-gray-light': 'var(--color-neutral-20, #e2e8f0)', // или --color-neutral-80/90 для светлой
        'theme-gray-medium': 'var(--color-neutral-50, #2d3748)',
        'theme-gray-dark': 'var(--color-neutral-90, #4a5568)', // или --color-neutral-20 для светлой
        'accent-custom': 'var(--color-accent, #4CAF50)',
        'card-custom': 'var(--color-modal-background, #2C2C2C)', // Пример использования переменной из index.css
        'header-custom': 'var(--color-primary-background, #1A1A1A)', // Пример
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'], // Из index.css
      },
      spacing: {
        // Добавить по результатам анализа используемых отступов
      },
      fontSize: {
        // Добавить по результатам анализа используемых размеров шрифта
      },
      borderRadius: {
        // Добавить по результатам анализа используемых радиусов
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}