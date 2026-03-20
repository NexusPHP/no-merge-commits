/**
 * Returns singular or plural form based on array length
 * @param iterable - Array to check length
 * @param singular - Singular form
 * @param plural - Plural form
 * @returns Singular or plural string based on array length
 */
export function inflect(iterable: unknown[], singular: string, plural: string): string {
    return iterable.length > 1 ? plural : singular;
}
