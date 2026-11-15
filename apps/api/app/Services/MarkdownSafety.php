<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Validation\ValidationException;

/**
 * Server-side safety checks for staff-authored markdown.
 *
 * The learner-facing renderer escapes raw HTML and allowlists link schemes,
 * but defence in depth matters here: content can be authored through the
 * admin API (not just the web UI), stored, and re-rendered for every learner.
 * This layer rejects anything that could smuggle an active URL into the
 * saved document — and caps its size so a hostile dump cannot balloon the
 * database.
 */
final class MarkdownSafety
{
    private const MAX_BYTES = 100_000;

    /**
     * Reject unsafe markdown with a 422 envelope naming the field.
     *
     * @param  array<string, mixed>  $data  Validated input; only string values are checked.
     * @param  array<string>|string  $field  Field(s) to check.
     */
    public static function assertSafe(array $data, array|string $field = 'markdown'): void
    {
        foreach ((array) $field as $fieldName) {
            self::checkField($data, $fieldName);
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private static function checkField(array $data, string $field): void
    {
        $value = $data[$field] ?? null;

        if (! is_string($value) || $value === '') {
            return;
        }

        if (strlen($value) > self::MAX_BYTES) {
            throw self::fail($field, 'Content exceeds the maximum allowed size.');
        }

        // Control characters other than tab/newline/carriage-return shape logs
        // and diffs in confusing ways.
        if (preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', $value) === 1) {
            throw self::fail($field, 'Content contains disallowed control characters.');
        }

        // Every `](url)` link destination must use a scheme we render safely.
        // Relative (/, #), http(s) and mailto are allowed; anything carrying a
        // scheme we do not recognise is rejected outright rather than
        // harmlessly demoted, so the author learns immediately.
        foreach (self::unsafeDestinations($value) as $destination) {
            throw self::fail($field, "Link scheme is not allowed ({$destination}). Use https, http, mailto or a relative path.");

        }
    }

    /**
     * Destinations that are not usable by the renderer.
     *
     * @return list<string>
     */
    public static function unsafeDestinations(string $markdown): array
    {
        if (preg_match_all('/\]\(\s*([^\s)]+)\s*(?:\s+"[^"]*")?\)/', $markdown, $matches) === 0) {
            return [];
        }

        return array_values(array_filter(
            array_map('trim', $matches[1]),
            static fn (string $destination): bool => ! self::isAllowedDestination($destination),
        ));
    }

    /**
     * A destination is allowed when it is a relative path/fragment or uses
     * http, https or mailto.
     */
    private static function isAllowedDestination(string $destination): bool
    {
        $lower = strtolower($destination);

        if ($lower !== '' && ($lower[0] === '/' || $lower[0] === '#')) {
            return true;
        }

        return str_starts_with($lower, 'https://')
            || str_starts_with($lower, 'http://')
            || str_starts_with($lower, 'mailto:');
    }

    /**
     * @return ValidationException
     */
    private static function fail(string $field, string $message): ValidationException
    {
        return ValidationException::withMessages([$field => [$message]]);
    }
}
