<!DOCTYPE html>
<html lang="ar" dir="rtl">

<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <style>
        body {
            font-family: 'DejaVu Sans', sans-serif;
            direction: rtl;
            text-align: right;
            font-size: 12px;
            color: #333;
        }

        .header {
            text-align: center;
            margin-bottom: 20px;
        }

        .english-text {
            direction: ltr;
            text-align: left;
            font-family: 'DejaVu Sans', sans-serif;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }

        th {
            background-color: #f2f2f2;
            color: #000;
            font-weight: bold;
            padding: 10px;
            border: 1px solid #ddd;
            text-align: center;
        }

        td {
            padding: 8px;
            border: 1px solid #ddd;
            text-align: center;
            vertical-align: middle;
        }

        /* تلوين الحالات لتمييزها في التقرير */
        .status-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10px;
        }
    </style>
</head>

<body>
    <div class="header">
        <h2>{{ $reportTitle }}</h2>
        <p>{{ __('tasks.generated_at') }}: {{ now()->format('Y-m-d H:i') }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th width="10%">{{ __('tasks.id_report') }}</th>
                <th width="30%">{{ __('tasks.title_en_report') }}</th>
                <th width="30%">{{ __('tasks.title_ar_report') }}</th>
                <th width="15%">{{ __('tasks.priority_report') }}</th>
                <th width="15%">{{ __('tasks.status_report') }}</th>
            </tr>
        </thead>
        <tbody>
            @foreach($tasks as $task)
            <tr>
                <td>{{ $task->id }}</td>
                <td class="english-text">{{ $task->title_en }}</td>
                <td>{{ $task->title_ar }}</td>
                <td>{{ __("tasks.priority_{$task->priority}") }}</td>
                <td>
                    {{ __("tasks.status_{$task->task_status}") }}
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
</body>

</html>