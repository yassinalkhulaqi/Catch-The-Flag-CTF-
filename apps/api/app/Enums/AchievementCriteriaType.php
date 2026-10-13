<?php

namespace App\Enums;

/**
 * Achievement evaluation rules — configuration-driven, logic lives in
 * Services/AchievementEvaluator (docs/database.md §7).
 */
enum AchievementCriteriaType: string
{
    case SolvesTotal = 'solves_total';
    case XpTotal = 'xp_total';
    case PathsCompleted = 'paths_completed';
    case CategorySolves = 'category_solves';
    case FirstBlood = 'first_blood';
}
