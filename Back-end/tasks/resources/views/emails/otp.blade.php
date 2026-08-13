<div dir="{{ app()->getLocale() == 'ar' ? 'rtl' : 'ltr' }}">
    <h2>{{ __('auth.welcome') }}</h2>
    <p>{{ __('auth.otp_message') }}</p>
    <h1 style="color: #4CAF50;">{{ $otp }}</h1>
    <p>{{ __('auth.otp_expiry_notice', ['minutes' => 15]) }}</p>
</div>