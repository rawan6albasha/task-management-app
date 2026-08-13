<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = [
        'code',
        'ar_name',
        'en_name',
        'value'
    ];

    public function users()
    {
        return $this->hasMany(User::class, 'branch_id');
    }

    public function tasks()
    {
        return $this->hasMany(Task::class, 'branch_id');
    }

    public function setBranchIdAttribute($value)
    {
        $isBranch = Setting::where('id', $value)->where('code', 'branch')->exists();

        if (!$isBranch && !is_null($value)) {
            throw new \Exception("The selected ID must be a valid Branch.");
        }

        $this->attributes['branch_id'] = $value;
    }
}
