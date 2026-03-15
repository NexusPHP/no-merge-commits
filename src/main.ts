import { setFailed } from "@actions/core";
import { runner } from "./runner.js";
import { log } from "./util.js";

void (async (): Promise<void> => {
    await runner().catch((error: unknown) => {
        if (error instanceof Error) {
            setFailed(error.message);

            if (error.stack) {
                log(`Stack trace: ${error.stack}`, "debug");
            }
        } else {
            setFailed("An unknown error occurred");
        }
    });
})();
