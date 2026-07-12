/**
 * Flowers manifest — list of all flower image filenames in /flowers.
 * Used by phase2.js to spawn random flowers.
 *
 * Each flower is reused many times across hundreds of pool elements; the
 * browser caches each decoded bitmap once per URL, so a small set is enough.
 */
window.FLOWER_FILES = [
    'african_daisy.webp',
    'allium.webp',
    'armeria.webp',
    'aster.webp',
    'blue_aster (1).webp',
    'blue_flax (1).webp',
    'flower2.webp',
    'flowers.webp',
    'new.webp',
    'red_aster (1).webp',
];

window.flowerUrl = function flowerUrl(name) {
    return 'flowers/' + encodeURIComponent(name);
};
