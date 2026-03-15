import * as core from "@actions/core";

export type LogLevel = "error" | "warning" | "debug" | "notice" | "info";

/**
 * Returns ANSI color code for the given log level
 * @param type - The log level type
 * @returns ANSI color code string
 */
export function color(type: LogLevel | "reset"): string {
    switch (type) {
        case "error":
            return "\x1B[31m";

        case "warning":
            return "\x1B[33m";

        case "debug":
        case "notice":
            return "\x1B[37m";

        case "reset":
            return "\x1B[0m";

        case "info":
        default:
            return "\x1B[32m";
    }
}

/**
 * Logs a message through GitHub Actions with appropriate color and level
 * @param message - The message to log
 * @param type - The log level (debug, error, notice, info)
 */
export function log(message: string, type: LogLevel): void {
    let callable: (message: string) => void;

    switch (type) {
        case "debug":
            callable = core.debug;
            break;

        case "error":
            callable = core.error;
            break;

        case "notice":
        case "info":
        default:
            callable = core.info;
    }

    callable(`${color(type)}[${type.toUpperCase()}] ${message}${color("reset")}`);
}

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
