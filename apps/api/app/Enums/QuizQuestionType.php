<?php

namespace App\Enums;

enum QuizQuestionType: string
{
    case Single = 'single';
    case Multiple = 'multiple';
    case TrueFalse = 'true_false';
}
