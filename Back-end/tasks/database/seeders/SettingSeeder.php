<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            ['code' => 'branch', 'ar_name' => 'المركز الرئيسي', 'en_name' => 'Main Center', 'value' => '1'],
            ['code' => 'branch', 'ar_name' => 'فرع المنطقة الغربية', 'en_name' => 'Western Branch', 'value' => '2'],

            ['code' => 'section', 'ar_name' => 'قسم الإدارة العامة', 'en_name' => 'General Administration', 'value' => '100'],
            ['code' => 'section', 'ar_name' => 'قسم التقنية', 'en_name' => 'Technical Section', 'value' => '101'],
            ['code' => 'section', 'ar_name' => 'قسم العمليات', 'en_name' => 'Operations Section', 'value' => '102'],

            ['code' => 'position', 'ar_name' => 'موظف', 'en_name' => 'Employee', 'value' => 'employee'],
            ['code' => 'position', 'ar_name' => 'مدير قسم', 'en_name' => 'Section Manager', 'value' => 'section_manager'],
            ['code' => 'position', 'ar_name' => 'مدير فرع', 'en_name' => 'Branch Manager', 'value' => 'branch_manager'],
            ['code' => 'position', 'ar_name' => 'مساعد مدير عام', 'en_name' => 'General Manager Assistant', 'value' => 'gm_assistant'],
            ['code' => 'position', 'ar_name' => 'مدير عام', 'en_name' => 'General Manager', 'value' => 'general_manager'],
            ['code' => 'position', 'ar_name' => 'مدير النظام', 'en_name' => 'System Administrator', 'value' => 'admin'],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(
                ['code' => $setting['code'], 'value' => $setting['value']],
                $setting
            );
        }
    }
}
