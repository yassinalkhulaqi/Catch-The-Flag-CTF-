<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\MarkdownSafety;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

/**
 * Server-side markdown link allowlist (defence in depth for staff-authored
 * content rendered for every learner).
 */
class MarkdownSafetyTest extends TestCase
{
    public function test_ordinary_markdown_passes(): void
    {
        MarkdownSafety::assertSafe([
            'content' => "Check [this](https://example.com) and [https](http://example.com) and [mail](mailto:a@b.example) and [relative](/paths/1) and [fragment](#section) and ```code blocks```",
        ], 'content');

        $this->assertTrue(true);
    }

    public function test_plain_text_without_links_passes(): void
    {
        MarkdownSafety::assertSafe(['content' => 'No links here, just words.'], 'content');

        $this->assertTrue(true);
    }

    public function test_javascript_links_are_rejected(): void
    {
        try {
            MarkdownSafety::assertSafe(['content' => 'Click [here](javascript:alert(1))'], 'content');
            $this->fail('Expected a ValidationException.');
        } catch (ValidationException $e) {
            $this->assertStringContainsString('content', json_encode($e->errors()));
        }
    }

    public function test_data_links_are_rejected(): void
    {
        try {
            MarkdownSafety::assertSafe(['content' => '[click](data:text/html,<h1>hi</h1>)'], 'content');
            $this->fail('Expected a ValidationException.');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('content', $e->errors());
        }
    }

    public function test_control_characters_are_rejected(): void
    {
        try {
            MarkdownSafety::assertSafe(['content' => "hello\x00world"], 'content');
            $this->fail('Expected a ValidationException.');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('content', $e->errors());
        }
    }

    public function test_oversize_content_is_rejected(): void
    {
        try {
            MarkdownSafety::assertSafe(['content' => str_repeat('a', 100_001)], 'content');
            $this->fail('Expected a ValidationException.');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('content', $e->errors());
        }
    }

    public function test_unsafe_destinations_lists_every_bad_link(): void
    {
        $bad = MarkdownSafety::unsafeDestinations(
            "Good [ok](https://example.com) Bad [x1](javascript:alert(1)) Bad [x2](vbscript:msgbox(1))"
        );

        $this->assertCount(2, $bad);
    }
}
