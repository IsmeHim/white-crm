<?php

declare(strict_types=1);

namespace CRM;

/**
 * Lightweight pure-PHP vector barcode generator for shipping labels and receipts.
 * Generates clean, crisp Code 128 (Subset B) SVG without any external dependencies.
 */
final class Barcode
{
    /**
     * Code 128 pattern table (107 patterns, each 6 widths, except STOP which has 7).
     */
    private const PATTERNS = [
        '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
        '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
        '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
        '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
        '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
        '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
        '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
        '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
        '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
        '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
        '114131', '311141', '411131', '211412', '211214', '211232', '2331112',
    ];

    /**
     * Generate an SVG representation of Code 128 barcode.
     *
     * @param string $text ASCII text to encode
     * @param int $height Height of the barcode in pixels
     * @param float $moduleWidth Width of a single module in pixels
     * @param bool $showText Whether to render human-readable text below the bars
     * @return string SVG markup string
     */
    public static function code128Svg(string $text, int $height = 45, float $moduleWidth = 1.6, bool $showText = true): string
    {
        $text = trim($text);
        if ($text === '') {
            return '';
        }

        // START B code is 104
        $startCode = 104;
        $codes = [$startCode];
        $checksum = $startCode;

        $len = strlen($text);
        for ($i = 0; $i < $len; $i++) {
            $ascii = ord($text[$i]);
            // Subset B handles ASCII 32 to 126
            if ($ascii < 32 || $ascii > 126) {
                $code = 0; // fallback space
            } else {
                $code = $ascii - 32;
            }
            $codes[] = $code;
            $checksum += ($i + 1) * $code;
        }

        $checksum %= 103;
        $codes[] = $checksum;
        $codes[] = 106; // STOP code

        $bars = [];
        $currentX = 10.0; // quiet zone

        foreach ($codes as $c) {
            $pattern = self::PATTERNS[$c] ?? '111111';
            $pLen = strlen($pattern);
            for ($j = 0; $j < $pLen; $j++) {
                $width = (int)$pattern[$j] * $moduleWidth;
                if ($j % 2 === 0) { // Bar (even indices)
                    $bars[] = sprintf(
                        '<rect x="%.2f" y="0" width="%.2f" height="%d" fill="#111827"/>',
                        $currentX,
                        $width,
                        $height
                    );
                }
                $currentX += $width;
            }
        }

        $totalWidth = $currentX + 10.0; // include end quiet zone
        $svgHeight = $height + ($showText ? 16 : 0);

        $textElement = '';
        if ($showText) {
            $escapedText = htmlspecialchars($text, ENT_QUOTES, 'UTF-8');
            $textElement = sprintf(
                '<text x="%.2f" y="%d" text-anchor="middle" font-family="monospace, monospace" font-size="11" font-weight="600" fill="#374151" letter-spacing="1">%s</text>',
                $totalWidth / 2,
                $height + 13,
                $escapedText
            );
        }

        return sprintf(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %.2f %d" width="%.2f" height="%d" class="barcode-svg">%s%s</svg>',
            $totalWidth,
            $svgHeight,
            $totalWidth,
            $svgHeight,
            implode('', $bars),
            $textElement
        );
    }
}
