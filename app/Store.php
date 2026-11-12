<?php

declare(strict_types=1);

namespace CRM;

use Generator;
use PDO;
use RuntimeException;
use Throwable;

/**
 * SQLite-backed ACID Storage Layer for White Channel CRM V2.
 *
 * Utilizes SQLite3 with Write-Ahead Logging (WAL) and IMMEDIATE transactions
 * to guarantee ACID compliance, prevent concurrent race conditions,
 * and provide fast cached query retrieval.
 */
final class Store
{
    private string $base;
    private PDO $pdo;

    public function __construct(string $base = CRM_STORAGE)
    {
        $this->base = rtrim($base, '/\\');
        foreach (['locks', 'exports', 'uploads'] as $dir) {
            $this->ensureDirectory($this->base . '/' . $dir);
        }

        $dbFile = $this->base . '/crm.sqlite';
        $this->pdo = new PDO('sqlite:' . $dbFile, null, null, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);

        // Enable Write-Ahead Logging for high concurrency and performance
        $this->pdo->exec('PRAGMA journal_mode = WAL');
        $this->pdo->exec('PRAGMA synchronous = NORMAL');
        $this->pdo->exec('PRAGMA busy_timeout = 5000');
        $this->pdo->exec('PRAGMA foreign_keys = ON');

        $this->initSchema();
    }

    /**
     * Ensure directory exists with secure permissions.
     */
    private function ensureDirectory(string $path): void
    {
        if (!is_dir($path) && !mkdir($path, 0700, true) && !is_dir($path)) {
            throw new RuntimeException('Cannot create storage directory: ' . $path);
        }
    }

    /**
     * Initialize core SQLite tables and indexes.
     */
    private function initSchema(): void
    {
        $this->pdo->exec('
            CREATE TABLE IF NOT EXISTS records (
                collection TEXT NOT NULL,
                id TEXT NOT NULL,
                version INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL DEFAULT "",
                updated_at TEXT NOT NULL DEFAULT "",
                deleted_at TEXT DEFAULT NULL,
                record_json TEXT NOT NULL,
                summary_json TEXT NOT NULL,
                search_text TEXT NOT NULL DEFAULT "",
                PRIMARY KEY (collection, id)
            );
            CREATE INDEX IF NOT EXISTS idx_records_list ON records (collection, deleted_at, created_at DESC, id DESC);

            CREATE TABLE IF NOT EXISTS cache (
                cache_key TEXT PRIMARY KEY,
                version TEXT NOT NULL,
                expires_at INTEGER NOT NULL,
                data_json TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS meta (
                k TEXT PRIMARY KEY,
                v TEXT NOT NULL
            );
        ');
    }

    /**
     * Validate collection name against path/SQL injection.
     */
    private function validateCollection(string $name): string
    {
        if (!preg_match('/^[a-z][a-z0-9_]{1,45}$/D', $name)) {
            throw new RuntimeException('Invalid collection name: ' . $name);
        }
        return $name;
    }

    /**
     * Validate record ID format.
     */
    private function validateId(string $id): string
    {
        if (!preg_match('/^[a-z][a-z0-9_\-]{2,100}$/Di', $id)) {
            throw new RuntimeException('Invalid record ID: ' . $id);
        }
        return $id;
    }

    /**
     * Build unified lowercase search string from summary data.
     */
    private function buildSearchText(array $summary): string
    {
        return mb_strtolower(implode(' ', array_map(fn($x) => is_scalar($x) ? (string)$x : '', $summary)), 'UTF-8');
    }

    /**
     * Access underlying PDO connection.
     */
    public function pdo(): PDO
    {
        return $this->pdo;
    }

    /**
     * Read a single record by collection and ID.
     */
    public function read(string $collection, string $id): ?array
    {
        $collection = $this->validateCollection($collection);
        $id = $this->validateId($id);

        $stmt = $this->pdo->prepare('SELECT record_json FROM records WHERE collection = ? AND id = ? LIMIT 1');
        $stmt->execute([$collection, $id]);
        $raw = $stmt->fetchColumn();

        if ($raw === false) {
            return null;
        }

        $obj = json_decode((string)$raw, true);
        if (!is_array($obj)) {
            throw new RuntimeException("Corrupt JSON payload: {$collection}/{$id}");
        }

        return $obj;
    }

    /**
     * Paginated list of summaries matching query and filters (including date_from / date_to).
     */
    public function listing(string $collection, string $query = '', array $filters = [], int $page = 1, int $perPage = 20): array
    {
        $collection = $this->validateCollection($collection);
        $page = max(1, min(100000, $page));
        $perPage = max(1, min(100, $perPage));
        $query = mb_strtolower(trim($query), 'UTF-8');

        $cacheKey = 'list-sqlite-v2-' . json_encode([$collection, $query, $filters, $page, $perPage], JSON_UNESCAPED_UNICODE);

        return $this->cached($cacheKey, 30, function () use ($collection, $query, $filters, $page, $perPage) {
            $dateFrom = isset($filters['date_from']) && preg_match('/^\d{4}-\d\d-\d\d$/', (string)$filters['date_from']) ? (string)$filters['date_from'] : '';
            $dateTo = isset($filters['date_to']) && preg_match('/^\d{4}-\d\d-\d\d$/', (string)$filters['date_to']) ? (string)$filters['date_to'] : '';
            unset($filters['date_from'], $filters['date_to']);

            $sql = 'SELECT summary_json, search_text FROM records WHERE collection = ? AND (deleted_at IS NULL OR deleted_at = "") ORDER BY created_at DESC, id DESC';
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$collection]);

            $items = [];
            $sumConfirmedSatang = 0;
            $sumTotalSatang = 0;

            while ($row = $stmt->fetch()) {
                if ($query !== '' && !str_contains((string)$row['search_text'], $query)) {
                    continue;
                }
                $a = json_decode((string)$row['summary_json'], true);
                if (!is_array($a) || !empty($a['deleted_at'])) {
                    continue;
                }

                if ($dateFrom !== '' || $dateTo !== '') {
                    $rawDate = match ($collection) {
                        'donations' => ($a['donated_at'] ?? '') !== '' ? $a['donated_at'] : ($a['created_at'] ?? ''),
                        'shipments' => ($a['sent_at'] ?? '') !== '' ? $a['sent_at'] : ($a['created_at'] ?? ''),
                        'tasks'     => ($a['due_date'] ?? '') !== '' ? $a['due_date'] : ($a['created_at'] ?? ''),
                        default     => ($a['created_at'] ?? ''),
                    };
                    $recDate = substr((string)$rawDate, 0, 10);
                    if ($dateFrom !== '' && ($recDate === '' || $recDate < $dateFrom)) {
                        continue;
                    }
                    if ($dateTo !== '' && ($recDate === '' || $recDate > $dateTo)) {
                        continue;
                    }
                }

                $match = true;
                foreach ($filters as $k => $v) {
                    if ($v !== '' && $v !== null && (string)($a[$k] ?? '') !== (string)$v) {
                        $match = false;
                        break;
                    }
                }
                if ($match) {
                    $items[] = $a;
                    if ($collection === 'donations') {
                        $amt = (int)($a['amount_satang'] ?? 0);
                        if (($a['status'] ?? '') !== 'cancelled') {
                            $sumTotalSatang += $amt;
                        }
                        if (($a['status'] ?? '') === 'confirmed') {
                            $sumConfirmedSatang += $amt;
                        }
                    }
                }
            }

            $total = count($items);
            $out = [
                'items' => array_slice($items, ($page - 1) * $perPage, $perPage),
                'total' => $total,
                'page'  => $page,
                'pages' => max(1, (int)ceil($total / $perPage)),
            ];
            if ($collection === 'donations') {
                $out['sum_confirmed_satang'] = $sumConfirmedSatang;
                $out['sum_total_satang'] = $sumTotalSatang;
            }
            return $out;
        });
    }

    /**
     * Generator yielding summaries for aggregation (without loading full record payloads).
     */
    public function summaries(string $collection): Generator
    {
        $collection = $this->validateCollection($collection);
        $stmt = $this->pdo->prepare('SELECT summary_json FROM records WHERE collection = ? AND (deleted_at IS NULL OR deleted_at = "") ORDER BY created_at DESC, id DESC');
        $stmt->execute([$collection]);

        while ($raw = $stmt->fetchColumn()) {
            $a = json_decode((string)$raw, true);
            if (is_array($a) && empty($a['deleted_at'])) {
                yield $a;
            }
        }
    }

    /**
     * Count active records in a collection.
     */
    public function count(string $collection): int
    {
        $collection = $this->validateCollection($collection);
        $stmt = $this->pdo->prepare('SELECT COUNT(*) FROM records WHERE collection = ? AND (deleted_at IS NULL OR deleted_at = "")');
        $stmt->execute([$collection]);
        return (int)$stmt->fetchColumn();
    }

    /**
     * Apply a set of record and summary changes as one atomic SQLite transaction.
     */
    public function transact(array $changes): void
    {
        $this->pdo->exec('BEGIN IMMEDIATE TRANSACTION');
        try {
            $checkStmt = $this->pdo->prepare('SELECT version FROM records WHERE collection = ? AND id = ? LIMIT 1');
            $upsertStmt = $this->pdo->prepare('
                INSERT INTO records (collection, id, version, created_at, updated_at, deleted_at, record_json, summary_json, search_text)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(collection, id) DO UPDATE SET
                    version      = excluded.version,
                    created_at   = excluded.created_at,
                    updated_at   = excluded.updated_at,
                    deleted_at   = excluded.deleted_at,
                    record_json  = excluded.record_json,
                    summary_json = excluded.summary_json,
                    search_text  = excluded.search_text
            ');

            foreach ($changes as $change) {
                $collection = $this->validateCollection((string)$change['collection']);
                $id = $this->validateId((string)$change['id']);
                $record = $change['record'];
                $summary = $change['summary'];

                if (array_key_exists('expected_version', $change)) {
                    $checkStmt->execute([$collection, $id]);
                    $oldVersion = $checkStmt->fetchColumn();
                    if ($oldVersion === false || (int)$oldVersion !== (int)$change['expected_version']) {
                        throw new RuntimeException('Conflict: record changed concurrently, reload and retry');
                    }
                }

                $version = (int)($record['version'] ?? 1);
                $createdAt = (string)($record['created_at'] ?? '');
                $updatedAt = (string)($record['updated_at'] ?? $createdAt);
                $deletedAt = !empty($record['deleted_at']) ? (string)$record['deleted_at'] : null;
                $recJson = json_encode($record, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
                $sumJson = json_encode($summary, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
                $searchText = $this->buildSearchText($summary);

                $upsertStmt->execute([$collection, $id, $version, $createdAt, $updatedAt, $deletedAt, $recJson, $sumJson, $searchText]);
            }

            $this->bumpCacheVersion();
            $this->pdo->exec('COMMIT');
        } catch (Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->exec('ROLLBACK');
            }
            throw $e;
        }
    }

    /**
     * Insert a new unique record into the database.
     */
    public function insert(string $collection, array $record, array $summary): void
    {
        if ($this->read($collection, (string)$record['id']) !== null) {
            throw new RuntimeException('Record already exists');
        }
        $this->transact([[
            'collection' => $collection,
            'id'         => $record['id'],
            'record'     => $record,
            'summary'    => $summary,
        ]]);
    }

    /**
     * Update an existing record with optimistic version concurrency check.
     */
    public function update(string $collection, array $record, array $summary, int $expectedVersion): void
    {
        $this->transact([[
            'collection'       => $collection,
            'id'               => $record['id'],
            'record'           => $record,
            'summary'          => $summary,
            'expected_version' => $expectedVersion,
        ]]);
    }

    /**
     * Get global cache invalidation version token.
     */
    private function getCacheVersion(): string
    {
        $stmt = $this->pdo->prepare('SELECT v FROM meta WHERE k = ? LIMIT 1');
        $stmt->execute(['cache_version']);
        $v = $stmt->fetchColumn();
        return $v !== false ? (string)$v : 'initial';
    }

    /**
     * Invalidate entire application query cache.
     */
    private function bumpCacheVersion(): void
    {
        $v = bin2hex(random_bytes(8));
        $stmt = $this->pdo->prepare('INSERT INTO meta (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v');
        $stmt->execute(['cache_version', $v]);
        $this->pdo->exec('DELETE FROM cache');
    }

    /**
     * Cached query resolver with TTL and automatic invalidation.
     */
    public function cached(string $key, int $ttl, callable $resolve): mixed
    {
        $hashKey = hash('sha256', $key);
        $version = $this->getCacheVersion();
        $now = time();

        $stmt = $this->pdo->prepare('SELECT version, expires_at, data_json FROM cache WHERE cache_key = ? LIMIT 1');
        $stmt->execute([$hashKey]);
        $row = $stmt->fetch();

        if ($row && $row['version'] === $version && (int)$row['expires_at'] > $now) {
            return json_decode((string)$row['data_json'], true);
        }

        $data = $resolve();
        $saveStmt = $this->pdo->prepare('
            INSERT INTO cache (cache_key, version, expires_at, data_json)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(cache_key) DO UPDATE SET
                version    = excluded.version,
                expires_at = excluded.expires_at,
                data_json  = excluded.data_json
        ');
        $saveStmt->execute([$hashKey, $version, $now + $ttl, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)]);
        return $data;
    }

    /**
     * Calculate disk usage of the SQLite database and its WAL files.
     */
    public function diskUsage(): int
    {
        $total = 0;
        foreach (['crm.sqlite', 'crm.sqlite-wal', 'crm.sqlite-shm'] as $file) {
            $path = $this->base . '/' . $file;
            if (is_file($path)) {
                $total += (int)filesize($path);
            }
        }
        return $total;
    }
}
