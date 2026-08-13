<?php

namespace App\Traits;

use App\Models\File;
use Illuminate\Support\Facades\Auth;

trait TaskResponse
{
    public function TaskSuccessResponse($data = null, $message = null, $code = null)
    {
        return response()->json([
            'data' => $data,
            'message' => $message,
            'code' => $code,
        ], $code);
    }

    public function TaskErrorResponse($message = null, $code = null)
    {
        return response()->json([
            'message' => $message,
            'code' => $code,
        ], $code);
    }

    protected function handleFiles($task, $request)
    {
        if ($request->filled('library_files')) {
            $libraryIds = is_array($request->library_files)
                ? $request->library_files
                : [$request->library_files];

            $existingIds = File::whereIn('id', $libraryIds)->pluck('id')->toArray();

            if (! empty($existingIds)) {
                $task->files()->syncWithoutDetaching($existingIds);
            }
        }

        if ($request->hasFile('new_files')) {
            foreach ($request->file('new_files') as $file) {

                $path = $file->store('tasks_attachments', 'public');

                $fileRecord = File::create([
                    'uploaded_by' => Auth::id(),
                    'name' => $file->getClientOriginalName(),
                    'file_path' => $path,
                    'file_type' => $file->getClientMimeType(),
                ]);

                if ($fileRecord) {
                    $task->files()->attach($fileRecord->id);
                }
            }
        }
    }
}
