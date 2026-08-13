<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Task;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SendDueDateNotifications extends Command
{
    protected $signature = 'tasks:send-due-notifications';
    protected $description = 'إرسال إشعارات يومية للمهام التي يقترب موعد تسليمها (خلال 5 أيام)';

    public function handle()
    {
        $today = Carbon::today();
        $fiveDaysFromNow = Carbon::today()->addDays(5);

        $tasks = Task::whereNotIn('task_status', ['completed', 'cancelled'])
            ->whereBetween('due_date', [$today, $fiveDaysFromNow])
            ->get();

        foreach ($tasks as $task) {
            $daysLeft = $today->diffInDays(Carbon::parse($task->due_date), false);
            
            $title = __('notifications.due_warning_title');
            $content = __('notifications.due_warning_content', [
                'title' => $task->title_ar,
                'days'  => $daysLeft == 0 ? __('notifications.today') : $daysLeft
            ]);

            DB::table('notifications')->insert([
                'user_id'      => $task->assigned_id,
                'title'        => $title,
                'content'      => $content,
                'related_id'   => $task->id,
                'related_type' => 'due_date_reminder',
                'is_read'      => 0,
                'created_at'   => now(),
                'updated_at'   => now(),
            ]);
        }

        $this->info('تم إرسال إشعارات التذكير بنجاح.');
    }
}