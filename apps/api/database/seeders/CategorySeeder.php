<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

/**
 * The 8 V1 disciplines (docs/database.md §3). Keyed on slug so repeated
 * runs converge instead of failing.
 */
class CategorySeeder extends Seeder
{
    /**
     * @var list<array{slug: string, name: string, description: string, sort_order: int}>
     */
    private const CATEGORIES = [
        [
            'slug' => 'web',
            'name' => 'Web Exploitation',
            'description' => 'SQL injection, XSS, SSRF, auth bypass, and other web application attacks.',
            'sort_order' => 10,
        ],
        [
            'slug' => 'crypto',
            'name' => 'Cryptography',
            'description' => 'Classical ciphers, RSA, AES, hashing, and protocol flaws.',
            'sort_order' => 20,
        ],
        [
            'slug' => 'forensics',
            'name' => 'Digital Forensics',
            'description' => 'Disk images, memory dumps, steganography, and artifact recovery.',
            'sort_order' => 30,
        ],
        [
            'slug' => 'pwn',
            'name' => 'Binary Exploitation',
            'description' => 'Buffer overflows, format strings, ROP, and memory corruption.',
            'sort_order' => 40,
        ],
        [
            'slug' => 'reverse',
            'name' => 'Reverse Engineering',
            'description' => 'Disassembly, decompilation, and binary analysis with Ghidra and friends.',
            'sort_order' => 50,
        ],
        [
            'slug' => 'osint',
            'name' => 'OSINT',
            'description' => 'Open-source intelligence: usernames, metadata, and public records.',
            'sort_order' => 60,
        ],
        [
            'slug' => 'network',
            'name' => 'Network Security',
            'description' => 'Packet analysis, Wi-Fi, protocols, and traffic forensics.',
            'sort_order' => 70,
        ],
        [
            'slug' => 'misc',
            'name' => 'Miscellaneous',
            'description' => 'Trivia, scripting puzzles, and everything that fits nowhere else.',
            'sort_order' => 80,
        ],
    ];

    public function run(): void
    {
        foreach (self::CATEGORIES as $category) {
            Category::updateOrCreate(
                ['slug' => $category['slug']],
                [
                    'name' => $category['name'],
                    'description' => $category['description'],
                    'sort_order' => $category['sort_order'],
                    'is_active' => true,
                ],
            );
        }
    }
}
