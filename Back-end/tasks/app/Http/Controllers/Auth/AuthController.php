<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Traits\TaskResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use App\Mail\OtpMail;
use Illuminate\Support\Facades\Mail;

class AuthController extends Controller
{
    use TaskResponse;

    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'branch_id' => [
                'required',
                Rule::exists('settings', 'id')->where(fn ($q) => $q->where('code', 'branch')),
            ],
            'section_id' => [
                'required',
                Rule::exists('settings', 'id')->where(fn ($q) => $q->where('code', 'section')),
            ],
            'position_id' => [
                'required',
                Rule::exists('settings', 'id')->where(fn ($q) => $q->where('code', 'position')),
            ],
        ]);
        if ($validator->fails()) {
            return $this->TaskErrorResponse($validator->errors(), 422);
        }

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('users_photos', 'public');
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'photo' => $photoPath,
            'branch_id' => $request->branch_id,
            'section_id' => $request->section_id,
            'position_id' => $request->position_id,
            'account_status' => 'inactive',
        ]);


        return $this->TaskSuccessResponse(
            null,
            __('auth.user_registered'),
            201
        );
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'remember_me' => 'boolean',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return $this->TaskErrorResponse(__('auth.incorrect_credentials'), 401);
        }

        if ($user->account_status == 'inactive') {
            return $this->TaskErrorResponse(__('auth.inactive'), 401);
        }

        if ($user->account_status == 'banned') {
            return $this->TaskErrorResponse(__('auth.banned'), 401);
        }

        $expiresAt = $request->remember_me
            ? now()->addMonths(6)
            : now()->addHours(24);

        $tokenResult = $user->createToken('auth_token', ['*'], $expiresAt);
        $token = $tokenResult->plainTextToken;

        return $this->TaskSuccessResponse([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
        ], __('auth.user_login'), 200);
    }

    public function profile(Request $request)
    {
        return $this->TaskSuccessResponse(
            $request->user()->load(['branch', 'section', 'position']),
            __('auth.your_profile'),
            200
        );
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return $this->TaskSuccessResponse(null, __('auth.logged_out'), 200);
    }

    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        $validator->after(function ($validator) use ($request) {
            if ($request->current_password && ! Hash::check($request->current_password, $request->user()->password)) {
                $validator->errors()->add(__('auth.current_password'), __('auth.pass_incorrect'));
            }
        });

        if ($validator->fails()) {
            return $this->TaskErrorResponse($validator->errors(), 422);
        }

        $request->user()->update([
            'password' => Hash::make($request->new_password),
        ]);

        return $this->TaskSuccessResponse(null, __('auth.pass_change_success'), 200);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|unique:users,email,'.$user->id,
            'photo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        if ($validator->fails()) {
            return $this->TaskErrorResponse($validator->errors(), 422);
        }

        $userData = $request->only(['name', 'email']);

        if ($request->hasFile('photo')) {
            if ($user->photo && Storage::disk('public')->exists($user->photo)) {
                Storage::disk('public')->delete($user->photo);
            }

            $userData['photo'] = $request->file('photo')->store('users_photos', 'public');
        }

        $user->update($userData);

        return $this->TaskSuccessResponse(
            $user->load(['branch', 'section', 'position']),
            __('auth.profile_updated'),
            200
        );
    }

    public function forgotPassword(Request $request)
{
    $validation = Validator::make($request->all(), [
        'email' => 'required|email|exists:users,email',
    ]);

    if ($validation->fails()) {
        return $this->TaskErrorResponse($validation->errors(), 422);
    }

    $otp = rand(100000, 999999);
    $user = User::where('email', $request->email)->first();

    $user->update([
        'otp_code' => $otp,
        'otp_expired_at' => now()->addMinutes(15),
    ]);

    Mail::to($user->email)->locale(app()->getLocale())->send(new OtpMail($otp));

    return $this->TaskSuccessResponse(['email' => $user->email,
            'otp_expired_at' => $user->otp_expired_at], __('auth.sent_code'), 200);
}

    public function resetPassword(Request $request)
    {
        $validation = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
            'otp' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validation->fails()) {
            return $this->TaskErrorResponse($validation->errors(), 422);
        }

        $user = User::where('email', $request->email)
            ->where('otp_code', $request->otp)
            ->first();

        if (! $user) {
            return $this->TaskErrorResponse(__('auth.otpOrEmail_incorrect'), 400);
        }

        if (now()->gt($user->otp_expired_at)) {
            return $this->TaskErrorResponse(__('auth.code_expired'), 400);
        }

        $user->update([
            'password' => Hash::make($request->password),
            'otp_code' => null,
            'otp_expired_at' => null,
        ]);

        return $this->TaskSuccessResponse(null, __('auth.reset_success'), 200);
    }
}
