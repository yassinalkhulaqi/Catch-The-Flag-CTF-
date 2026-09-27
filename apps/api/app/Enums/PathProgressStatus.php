<?php

namespace App\Enums;

enum PathProgressStatus: string
{
    case InProgress = 'in_progress';
    case Completed = 'completed';
}
