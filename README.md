# SBPS UI (Frontend)

Веб-інтерфейс для керування системою розумного будинку (React + TypeScript + Vite + TailwindCSS).

## Вимоги (Prerequisites)

* **Node.js** (версія 18 або вище)
* **npm**

## Встановлення залежностей (Installation)

```bash
npm install
```

## Налаштування (Configuration)

Замініть значення у файлі .env в корені папки sbps-ui на відповідні:

```properties
VITE_API_BASE_URL=http://localhost:8080 (як в spbs-api)
VITE_VAPID_PUBLIC_KEY=<Ваш публічний VAPID ключ>
```
## Запуск (Development)

Запуск локального сервера розробки:

```Bash
npm run dev
```

Додаток буде доступний за адресою (зазвичай): http://localhost:5173

## Збірка для prod
```Bash
npm run build
```

Для попереднього перегляду зібраної версії:

```Bash
npm run preview
```