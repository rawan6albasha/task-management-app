
## 🚀 How to Run Locally

Follow these steps to run both the Back-End and Front-End locally:

### 1. Back-End Setup
Open your terminal in the back-end directory:
```bash
cd Back-end/tasks
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve

```

### 2. Front-End Setup

In a second terminal window, run:

```bash
cd task-management-app
npm install
npm run dev
