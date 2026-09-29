<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'SOC', 'slug' => 'soc', 'description' => 'Security Operations Center workflows', 'color' => '#3B82F6', 'icon' => 'shield', 'sort_order' => 1],
            ['name' => 'Digital Forensics', 'slug' => 'digital-forensics', 'description' => 'Disk, memory, and artifact analysis', 'color' => '#8B5CF6', 'icon' => 'hard-drive', 'sort_order' => 2],
            ['name' => 'Network Forensics', 'slug' => 'network-forensics', 'description' => 'Packet capture and traffic analysis', 'color' => '#06B6D4', 'icon' => 'network', 'sort_order' => 3],
            ['name' => 'Malware Analysis', 'slug' => 'malware-analysis', 'description' => 'Static and dynamic malware triage', 'color' => '#EF4444', 'icon' => 'bug', 'sort_order' => 4],
            ['name' => 'Reverse Engineering', 'slug' => 'reverse-engineering', 'description' => 'Binary analysis and decompilation', 'color' => '#F59E0B', 'icon' => 'cpu', 'sort_order' => 5],
            ['name' => 'Cryptography', 'slug' => 'cryptography', 'description' => 'Ciphers, encodings, and crypto challenges', 'color' => '#10B981', 'icon' => 'key', 'sort_order' => 6],
            ['name' => 'OSINT', 'slug' => 'osint', 'description' => 'Open-source intelligence techniques', 'color' => '#EC4899', 'icon' => 'search', 'sort_order' => 7],
            ['name' => 'Steganography', 'slug' => 'steganography', 'description' => 'Hidden data in media and files', 'color' => '#64748B', 'icon' => 'image', 'sort_order' => 8],
        ];

        foreach ($categories as $row) {
            Category::query()->updateOrCreate(['slug' => $row['slug']], $row + ['is_active' => true]);
        }
    }
}
