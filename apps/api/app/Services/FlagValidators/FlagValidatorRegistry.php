<?php

declare(strict_types=1);

namespace App\Services\FlagValidators;

use App\Enums\FlagValidationType;
use InvalidArgumentException;

final class FlagValidatorRegistry
{
    /** @param array<string, FlagValidator> $validators */
    public function __construct(private array $validators = []) {}

    public function register(FlagValidationType $type, FlagValidator $validator): void
    {
        $this->validators[$type->value] = $validator;
    }

    public function get(FlagValidationType $type): FlagValidator
    {
        if (! isset($this->validators[$type->value])) {
            throw new InvalidArgumentException("Flag validator [{$type->value}] is not registered.");
        }

        if (! $type->isSupported()) {
            throw new InvalidArgumentException("Flag validation type [{$type->value}] is not supported in V1.");
        }

        return $this->validators[$type->value];
    }
}
