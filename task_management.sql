-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: 09 مايو 2026 الساعة 13:43
-- إصدار الخادم: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `task_management`
--

-- --------------------------------------------------------

--
-- بنية الجدول `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `files`
--

CREATE TABLE `files` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uploaded_by` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `file_type` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `files`
--

INSERT INTO `files` (`id`, `uploaded_by`, `name`, `file_type`, `file_path`, `created_at`, `updated_at`) VALUES
(12, 10, 'ASUS WALLPAPER (2).jpg', 'image/jpeg', 'tasks_attachments/hoon0mdrkyXuWiuWyZsirVz6tJOQ5FCTqir0xH5G.jpg', '2026-05-05 21:55:09', '2026-05-05 21:55:09'),
(13, 10, 'ASUS WALLPAPER (3).jpg', 'image/jpeg', 'tasks_attachments/bjrqdAjsA3SXLwNLe9xsIAZeDB2U9zbs6z9u6Zrs.jpg', '2026-05-05 21:55:09', '2026-05-05 21:55:09');

-- --------------------------------------------------------

--
-- بنية الجدول `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000001_create_cache_table', 1),
(2, '0001_01_01_000002_create_jobs_table', 1),
(3, '2024_04_28_200945_create_settings_table', 1),
(4, '2025_01_01_000000_create_users_table', 1),
(5, '2026_04_28_200837_create_projects_table', 1),
(6, '2026_04_28_200848_create_tasks_table', 1),
(7, '2026_04_28_200920_create_files_table', 1),
(8, '2026_04_28_200928_create_task_files_table', 1),
(9, '2026_04_28_200957_create_notifications_table', 1),
(10, '2026_04_28_234512_create_personal_access_tokens_table', 2),
(11, '2026_04_29_221621_add_refusal_reason_to_tasks_table', 3),
(12, '2026_04_29_221806_add_type_to_tasks_table', 3),
(13, '2026_04_30_223551_add_completed_date_to_tasks_table', 4);

-- --------------------------------------------------------

--
-- بنية الجدول `notifications`
--

CREATE TABLE `notifications` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `related_id` bigint(20) UNSIGNED DEFAULT NULL,
  `related_type` varchar(255) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `content` text DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(1, 'App\\Models\\User', 3, 'auth_token', 'dc186a6229c4fb0baa3304452c8ab4c73ef550b1b8ebcfacfb0246d440046849', '[\"*\"]', NULL, NULL, '2026-04-28 21:01:38', '2026-04-28 21:01:38'),
(2, 'App\\Models\\User', 4, 'auth_token', 'a70cb8d5306ae311e3a1deb1bfbc12109cfb6d84517a1dd1da66319cada17c27', '[\"*\"]', NULL, NULL, '2026-04-28 21:15:26', '2026-04-28 21:15:26'),
(3, 'App\\Models\\User', 5, 'auth_token', 'b8013c1f4e316e2bb114253d36bf8d4583ba12c849ce65d9ae8d37bddbc7d9b8', '[\"*\"]', NULL, NULL, '2026-04-28 21:24:38', '2026-04-28 21:24:38'),
(4, 'App\\Models\\User', 6, 'auth_token', 'cb594e08817f8628bc06664194108e0d65d6b534e6b87720e4585f5353d2c068', '[\"*\"]', NULL, NULL, '2026-04-28 21:25:24', '2026-04-28 21:25:24'),
(5, 'App\\Models\\User', 5, 'auth_token', '022fe3a5dad8fd8fe7abbc018a9af6adfd78be7d75a872793d7b4fbf83204885', '[\"*\"]', '2026-04-28 21:45:08', NULL, '2026-04-28 21:37:46', '2026-04-28 21:45:08'),
(6, 'App\\Models\\User', 7, 'auth_token', 'ff1ae4521c83926c5e4a7366b29f8de856251fa2f9236a5163dce8cb15713f5f', '[\"*\"]', NULL, NULL, '2026-04-28 21:48:44', '2026-04-28 21:48:44'),
(7, 'App\\Models\\User', 8, 'auth_token', 'd04aa255618f9570015ff11816f09cdb35fd153a9e6cf9c3ced42648c8b1bb12', '[\"*\"]', NULL, NULL, '2026-04-28 21:51:03', '2026-04-28 21:51:03'),
(9, 'App\\Models\\User', 8, 'auth_token', '65a5b2761233d98228cafea039101c1701495383cb302c51310c85956311f20f', '[\"*\"]', NULL, NULL, '2026-04-28 22:02:07', '2026-04-28 22:02:07'),
(10, 'App\\Models\\User', 9, 'auth_token', 'ca37b33774800263b6761a4a7c107fca2b89d91ee30629a49bfcd7668b345e5f', '[\"*\"]', NULL, NULL, '2026-04-28 22:05:42', '2026-04-28 22:05:42'),
(11, 'App\\Models\\User', 10, 'auth_token', '1cc95cf780dd64ba990a0e2501ef632e6ccf35e2205a9fed5c27ef4cdb27bf8f', '[\"*\"]', '2026-05-07 11:11:37', NULL, '2026-04-28 22:07:44', '2026-05-07 11:11:37'),
(12, 'App\\Models\\User', 8, 'auth_token', '32a40ad1810c37fda246159e8fd829cddc3082d35dae674f76f8c0970beca681', '[\"*\"]', NULL, NULL, '2026-04-28 22:16:40', '2026-04-28 22:16:40'),
(13, 'App\\Models\\User', 8, 'auth_token', 'da59193c0730cd143eecae905d29c17b26431708c5c111f620d995a8b9237fc7', '[\"*\"]', '2026-05-02 08:58:05', NULL, '2026-05-02 08:57:31', '2026-05-02 08:58:05'),
(14, 'App\\Models\\User', 11, 'auth_token', '2c72d88fd1797aa1da1fdc71eb2cb257e644277f0a966205f4a8613fbcdd0446', '[\"*\"]', NULL, NULL, '2026-05-04 10:09:37', '2026-05-04 10:09:37'),
(15, 'App\\Models\\User', 11, 'auth_token', '823bfa502574db7e9cf83e108da422da60bed7236fa78a8d834cc0b6799293dc', '[\"*\"]', '2026-05-04 11:55:35', NULL, '2026-05-04 11:34:26', '2026-05-04 11:55:35'),
(16, 'App\\Models\\User', 11, 'auth_token', '4293ed529d46e73be92feb54c43d644736471e30823c190fb8824eeb85c2d9a1', '[\"*\"]', '2026-05-05 21:57:37', '2026-05-06 18:40:08', '2026-05-05 18:40:08', '2026-05-05 21:57:37'),
(17, 'App\\Models\\User', 11, 'auth_token', '6c45d024e28c9f9ee8b1266784bcf15bb8bb8d93ca4a37e99f90ab901455648b', '[\"*\"]', '2026-05-05 22:43:40', '2026-05-06 21:05:50', '2026-05-05 21:05:50', '2026-05-05 22:43:40'),
(18, 'App\\Models\\User', 11, 'auth_token', 'dee64edee8ed095105b45b27c21c2dae8ed03af4798011585e5537e4292a9971', '[\"*\"]', NULL, '2026-05-08 10:26:13', '2026-05-07 10:26:13', '2026-05-07 10:26:13'),
(19, 'App\\Models\\User', 11, 'auth_token', 'f8660d88c0a11db6923b21875158342be38f82debdccf9618b53efe213edde4f', '[\"*\"]', '2026-05-08 11:59:40', '2026-05-08 13:14:54', '2026-05-07 13:14:54', '2026-05-08 11:59:40'),
(20, 'App\\Models\\User', 11, 'auth_token', '513b9fcd06ad03cf2e5337761dc13dbebe911664522690db8afd9272eb4923ed', '[\"*\"]', '2026-05-09 08:41:10', '2026-05-09 13:25:10', '2026-05-08 13:25:10', '2026-05-09 08:41:10'),
(21, 'App\\Models\\User', 12, 'auth_token', '5392ecd804d1f95149e9e9f5989494da97ae1fc32da00ec3a47e24d7afadd323', '[\"*\"]', NULL, NULL, '2026-05-09 04:54:13', '2026-05-09 04:54:13');

-- --------------------------------------------------------

--
-- بنية الجدول `projects`
--

CREATE TABLE `projects` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name_ar` varchar(255) DEFAULT NULL,
  `name_en` varchar(255) DEFAULT NULL,
  `start_date` date NOT NULL,
  `expected_expired_date` date NOT NULL,
  `project_amount` double NOT NULL,
  `description_en` text DEFAULT NULL,
  `description_ar` text DEFAULT NULL,
  `status` enum('starting_soon','in_progress','completed','cancelled') NOT NULL DEFAULT 'starting_soon',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `projects`
--

INSERT INTO `projects` (`id`, `name_ar`, `name_en`, `start_date`, `expected_expired_date`, `project_amount`, `description_en`, `description_ar`, `status`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'سيبرلاى', 'fvghjm', '2026-05-19', '2026-06-29', 4567, NULL, NULL, 'starting_soon', 1, NULL, NULL),
(2, 'مشروع تطوير النظام', 'System Development Project', '2024-05-01', '2024-12-31', 15000.5, 'Project description in English', 'وصف المشروع باللغة العربية', 'starting_soon', 0, '2026-04-28 22:51:20', '2026-05-05 21:15:09');

-- --------------------------------------------------------

--
-- بنية الجدول `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`) VALUES
('A6azUGKPswIwuNcym1a3uERMwYPHbGri0vmm0Idw', NULL, '127.0.0.1', 'PostmanRuntime/7.51.1', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiNXNWeTdqckJrRG1obEFwbXp5ZERrME1DM29iY0JLV0hLUHlIQVc2RSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1777420582);

-- --------------------------------------------------------

--
-- بنية الجدول `settings`
--

CREATE TABLE `settings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `code` varchar(255) NOT NULL,
  `ar_name` varchar(255) NOT NULL,
  `en_name` varchar(255) NOT NULL,
  `value` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `settings`
--

INSERT INTO `settings` (`id`, `code`, `ar_name`, `en_name`, `value`, `created_at`, `updated_at`) VALUES
(1, 'branch', 'المركز الرئيسي', 'Main Center', '1', '2026-04-28 21:23:21', '2026-04-28 21:23:21'),
(2, 'branch', 'فرع المنطقة الغربية', 'Western Branch', '2', '2026-04-28 21:23:21', '2026-04-28 21:23:21'),
(3, 'section', 'قسم الإدارة العامة', 'General Administration', '100', '2026-04-28 21:23:21', '2026-04-28 21:23:21'),
(4, 'section', 'قسم التقنية', 'Technical Section', '101', '2026-04-28 21:23:21', '2026-04-28 21:23:21'),
(5, 'section', 'قسم العمليات', 'Operations Section', '102', '2026-04-28 21:23:21', '2026-04-28 21:23:21'),
(6, 'position', 'موظف', 'Employee', 'employee', '2026-04-28 21:23:21', '2026-04-28 21:23:21'),
(7, 'position', 'مدير قسم', 'Section Manager', 'section_manager', '2026-04-28 21:23:21', '2026-04-28 21:23:21'),
(8, 'position', 'مدير فرع', 'Branch Manager', 'branch_manager', '2026-04-28 21:23:21', '2026-04-28 21:23:21'),
(9, 'position', 'مساعد مدير عام', 'General Manager Assistant', 'general_manager', '2026-04-28 21:23:21', '2026-04-28 21:23:21'),
(10, 'position', 'مدير عام', 'General Manager', 'general_manager', '2026-04-28 21:23:21', '2026-04-28 21:23:21'),
(11, 'position', 'مدير النظام', 'System Administrator', 'admin', '2026-04-28 21:23:21', '2026-04-28 21:23:21'),
(12, 'branch', 'qassaa branch', 'فرع القصاع', '101', '2026-05-08 18:26:47', '2026-05-08 18:26:47');

-- --------------------------------------------------------

--
-- بنية الجدول `tasks`
--

CREATE TABLE `tasks` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `type` enum('task','meeting','follow_up','milestone','support') NOT NULL DEFAULT 'task',
  `parent_id` bigint(20) UNSIGNED DEFAULT NULL,
  `branch_id` bigint(20) UNSIGNED NOT NULL,
  `section_id` bigint(20) UNSIGNED NOT NULL,
  `position_id` bigint(20) UNSIGNED NOT NULL,
  `assigned_id` bigint(20) UNSIGNED NOT NULL,
  `created_by_id` bigint(20) UNSIGNED NOT NULL,
  `approved_by_id` bigint(20) UNSIGNED DEFAULT NULL,
  `title_ar` varchar(255) NOT NULL,
  `title_en` varchar(255) DEFAULT NULL,
  `description_ar` text DEFAULT NULL,
  `description_en` text DEFAULT NULL,
  `priority` enum('low','medium','high') NOT NULL,
  `task_status` enum('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
  `needs_approval` tinyint(1) NOT NULL DEFAULT 0,
  `status_approval` enum('pending','confirmed','rejected') NOT NULL DEFAULT 'pending',
  `refusal_reason` text DEFAULT NULL,
  `rate` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `amount` double NOT NULL DEFAULT 0,
  `due_date` date DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `completed_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `tasks`
--

INSERT INTO `tasks` (`id`, `project_id`, `type`, `parent_id`, `branch_id`, `section_id`, `position_id`, `assigned_id`, `created_by_id`, `approved_by_id`, `title_ar`, `title_en`, `description_ar`, `description_en`, `priority`, `task_status`, `needs_approval`, `status_approval`, `refusal_reason`, `rate`, `amount`, `due_date`, `start_date`, `end_date`, `completed_date`, `created_at`, `updated_at`) VALUES
(1, 2, 'task', 1, 1, 6, 7, 8, 10, 9, 'عنوان جديد', 'new title', 'وصف المهمة باللغة العربية', 'Task description in english', 'low', 'in_progress', 1, 'confirmed', NULL, 0, 60000, '2026-10-16', '2026-10-10', '2026-10-15', NULL, NULL, '2026-05-07 11:11:05'),
(2, 1, 'meeting', NULL, 1, 1, 1, 10, 10, 10, 'صيانة دورية للمحركات', 'Periodic Engine Maintenance', 'وصف', 'description', 'high', 'cancelled', 1, 'rejected', 'الميزانية المرصودة للمهمة تتجاوز الحد المسموح به حالياً.', 0, 500.5, '2026-12-31', '2026-04-30', NULL, NULL, '2026-04-29 22:12:06', '2026-04-29 22:40:49'),
(3, 2, 'milestone', NULL, 1, 1, 1, 11, 10, NULL, 'صيانة دورية للمحركات', 'Periodic Engine Maintenance', 'وصف', 'description', 'high', 'pending', 1, 'pending', NULL, 0, 500.5, '2026-12-31', NULL, NULL, NULL, '2026-04-30 20:40:43', '2026-04-30 20:40:43'),
(4, 1, 'milestone', NULL, 1, 1, 1, 10, 10, NULL, 'صيانة دورية للمحركات', 'Periodic Engine Maintenance', 'وصف', 'description', 'high', 'pending', 1, 'pending', NULL, 0, 500.5, '2026-12-31', NULL, NULL, NULL, '2026-04-30 20:42:41', '2026-04-30 20:42:41'),
(5, 1, 'milestone', NULL, 1, 1, 1, 10, 10, NULL, 'صيانة دورية للمحركات', 'Periodic Engine Maintenance', 'وصف', 'description', 'high', 'pending', 1, 'pending', NULL, 0, 500.5, '2026-12-31', NULL, NULL, NULL, '2026-04-30 21:03:45', '2026-04-30 21:03:45'),
(6, 1, 'milestone', NULL, 1, 1, 1, 10, 10, NULL, 'صيانة دورية للمحركات', 'Periodic Engine Maintenance', 'وصف', 'description', 'high', 'pending', 1, 'pending', NULL, 0, 500.5, '2026-12-31', NULL, NULL, NULL, '2026-04-30 21:03:52', '2026-04-30 21:03:52'),
(7, 1, 'milestone', NULL, 1, 1, 1, 8, 10, NULL, 'صيانة دورية للمحركات', 'Periodic Engine Maintenance', 'وصف', 'description', 'high', 'pending', 1, 'pending', NULL, 0, 500.5, '2026-12-31', NULL, NULL, NULL, '2026-04-30 21:07:17', '2026-04-30 21:07:17'),
(8, 1, 'milestone', NULL, 1, 1, 1, 10, 10, NULL, 'صيانة دورية للمحركات', 'Periodic Engine Maintenance', 'وصف', 'description', 'high', 'pending', 1, 'pending', NULL, 0, 500.5, '2026-12-31', NULL, NULL, NULL, '2026-05-05 21:54:51', '2026-05-05 21:54:51'),
(9, 1, 'milestone', NULL, 1, 1, 1, 10, 10, NULL, 'صيانة دورية للمحركات', 'Periodic Engine Maintenance', 'وصف', 'description', 'high', 'pending', 1, 'pending', NULL, 0, 500.5, '2026-12-31', NULL, NULL, NULL, '2026-05-05 21:55:09', '2026-05-05 21:55:09'),
(10, 2, 'task', 1, 1, 6, 7, 8, 10, 9, 'عنوان جديد', 'new title', 'وصف المهمة باللغة العربية', 'Task description in english', 'low', 'pending', 1, 'pending', NULL, 0, 60000, '2026-10-16', '2026-10-10', NULL, NULL, '2026-05-07 11:11:37', '2026-05-07 11:11:37');

-- --------------------------------------------------------

--
-- بنية الجدول `task_files`
--

CREATE TABLE `task_files` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `task_id` bigint(20) UNSIGNED NOT NULL,
  `file_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `task_files`
--

INSERT INTO `task_files` (`id`, `task_id`, `file_id`, `created_at`, `updated_at`) VALUES
(16, 1, 12, NULL, NULL),
(17, 10, 12, NULL, NULL);

-- --------------------------------------------------------

--
-- بنية الجدول `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `fcm_token` varchar(255) DEFAULT NULL,
  `branch_id` bigint(20) UNSIGNED DEFAULT NULL,
  `section_id` bigint(20) UNSIGNED DEFAULT NULL,
  `position_id` bigint(20) UNSIGNED DEFAULT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `account_status` enum('active','inactive','banned') NOT NULL DEFAULT 'inactive',
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `fcm_token`, `branch_id`, `section_id`, `position_id`, `photo`, `account_status`, `remember_token`, `created_at`, `updated_at`) VALUES
(8, 'angel', 'angel@gmail.com', NULL, '$2y$12$00R7Lsi2zCFbutfV/FChp.xjDEyhqCTn6poXuiyMukAWRNy.jC1di', NULL, 1, 5, 10, NULL, '', NULL, '2026-04-28 21:51:03', '2026-05-04 11:43:59'),
(9, 'angel', 'angel5@gmail.com', NULL, '$2y$12$Z4mTI69XOk9HDKy0BM4wpOlSf0/31zAslWr2jTe.5Vuyw/VTsfiTC', NULL, 1, 5, 9, NULL, 'active', NULL, '2026-04-28 22:05:42', '2026-04-28 22:05:42'),
(10, 'aaa', 'angel55@gmail.com', NULL, '$2y$12$BZNCAqZoixFxDgAeBFJaJeFkD1cUNttfCBjJBwPscnJ0PyL.X9gAu', NULL, 1, 5, 9, 'users_photos/gf9j1Qbp3CxKGITzLea9H9ELeKMJHI5HyokhWYqx.jpg', 'active', NULL, '2026-04-28 22:07:44', '2026-04-28 22:24:37'),
(11, 'angel', 'angel535@gmail.com', NULL, '$2y$12$HFOc4iIG04TgfZW4tHmKpOPcBHy.nFRiZNTaSq024nZLVjPEDnp1e', NULL, 1, 5, 11, NULL, 'active', NULL, '2026-05-04 10:09:36', '2026-05-04 10:09:36'),
(12, 'angel', 'angel5355@gmail.com', NULL, '$2y$12$B7HBWXwSio4PECQfenus1eNW5DZCRSBzEd3sw/IgjzpCgxl.4iv1G', NULL, 1, 5, 9, 'users_photos/SNFQWKAjnuM0ECXa31yXkqwziAlhl8M5X6Bi53jr.jpg', 'inactive', NULL, '2026-05-09 04:54:12', '2026-05-09 04:54:12');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `files`
--
ALTER TABLE `files`
  ADD PRIMARY KEY (`id`),
  ADD KEY `files_uploaded_by_foreign` (`uploaded_by`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notifications_user_id_foreign` (`user_id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  ADD KEY `personal_access_tokens_expires_at_index` (`expires_at`);

--
-- Indexes for table `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tasks_project_id_foreign` (`project_id`),
  ADD KEY `tasks_parent_id_foreign` (`parent_id`),
  ADD KEY `tasks_branch_id_foreign` (`branch_id`),
  ADD KEY `tasks_section_id_foreign` (`section_id`),
  ADD KEY `tasks_position_id_foreign` (`position_id`),
  ADD KEY `tasks_assigned_id_foreign` (`assigned_id`),
  ADD KEY `tasks_created_by_id_foreign` (`created_by_id`),
  ADD KEY `tasks_approved_by_id_foreign` (`approved_by_id`);

--
-- Indexes for table `task_files`
--
ALTER TABLE `task_files`
  ADD PRIMARY KEY (`id`),
  ADD KEY `task_files_task_id_foreign` (`task_id`),
  ADD KEY `task_files_file_id_foreign` (`file_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD KEY `users_branch_id_foreign` (`branch_id`),
  ADD KEY `users_section_id_foreign` (`section_id`),
  ADD KEY `users_position_id_foreign` (`position_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `files`
--
ALTER TABLE `files`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `projects`
--
ALTER TABLE `projects`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `settings`
--
ALTER TABLE `settings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `tasks`
--
ALTER TABLE `tasks`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `task_files`
--
ALTER TABLE `task_files`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- قيود الجداول المُلقاة.
--

--
-- قيود الجداول `files`
--
ALTER TABLE `files`
  ADD CONSTRAINT `files_uploaded_by_foreign` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- قيود الجداول `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- قيود الجداول `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `tasks_approved_by_id_foreign` FOREIGN KEY (`approved_by_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tasks_assigned_id_foreign` FOREIGN KEY (`assigned_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tasks_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `settings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tasks_created_by_id_foreign` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tasks_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tasks_position_id_foreign` FOREIGN KEY (`position_id`) REFERENCES `settings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tasks_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tasks_section_id_foreign` FOREIGN KEY (`section_id`) REFERENCES `settings` (`id`) ON DELETE CASCADE;

--
-- قيود الجداول `task_files`
--
ALTER TABLE `task_files`
  ADD CONSTRAINT `task_files_file_id_foreign` FOREIGN KEY (`file_id`) REFERENCES `files` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `task_files_task_id_foreign` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE;

--
-- قيود الجداول `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `settings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `users_position_id_foreign` FOREIGN KEY (`position_id`) REFERENCES `settings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `users_section_id_foreign` FOREIGN KEY (`section_id`) REFERENCES `settings` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
