<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Tag;
use Illuminate\Database\Seeder;

/**
 * Shared challenge tags. Keyed on slug so repeated runs converge.
 */
class TagSeeder extends Seeder
{
    /**
     * @var list<array{slug: string, name: string}>
     */
    private const TAGS = [
        ['slug' => 'sql-injection', 'name' => 'SQL Injection'],
        ['slug' => 'xss', 'name' => 'XSS'],
        ['slug' => 'rsa', 'name' => 'RSA'],
        ['slug' => 'aes', 'name' => 'AES'],
        ['slug' => 'steg', 'name' => 'Steganography'],
        ['slug' => 'pcap', 'name' => 'PCAP Analysis'],
        ['slug' => 'volatility', 'name' => 'Volatility'],
        ['slug' => 'elf', 'name' => 'ELF'],
        ['slug' => 'ghidra', 'name' => 'Ghidra'],
        ['slug' => 'osint-usernames', 'name' => 'OSINT Usernames'],
        ['slug' => 'wireshark', 'name' => 'Wireshark'],
        ['slug' => 'misc-trivia', 'name' => 'Trivia'],
    ];

    public function run(): void
    {
        foreach (self::TAGS as $tag) {
            Tag::updateOrCreate(
                ['slug' => $tag['slug']],
                ['name' => $tag['name']],
            );
        }
    }
}
