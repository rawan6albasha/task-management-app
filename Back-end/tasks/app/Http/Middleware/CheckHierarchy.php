<?php

namespace App\Http\Middleware;

use App\Traits\TaskResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckHierarchy
{
    use TaskResponse;

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, $minRole): Response
    {
        $user = auth()->user()->load('position');
        $userRole = $user->position->value;

        $hierarchy = [
            'admin' => 5,
            'general_manager' => 4,
            'gm_assistant' => 3,
            'branch_manager' => 2,
            'section_manager' => 1,
            'employee' => 0,
        ];

        $userWeight = $hierarchy[$userRole] ?? -1;
        $requiredWeight = $hierarchy[$minRole] ?? 999;

        if ($userWeight >= $requiredWeight) {
            return $next($request);
        }

        return $this->TaskErrorResponse(__('auth.hierarchy_denied'), 403);
    }
}
