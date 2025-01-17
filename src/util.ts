import * as core from "@actions/core";

export function color(type: string): string {
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

export function log(message: string, type: string): void {
    let callable;

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

export function inflect(iterable: unknown[], singular: string, plural: string): string {
    return (iterable.length > 1 && plural) || singular;
}
