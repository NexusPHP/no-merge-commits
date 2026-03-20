import { debug, setFailed } from "@actions/core";
import { runner } from "./runner.js";

void (async (): Promise<void> => {
    await runner().catch((error: unknown) => {
        if (error instanceof Error) {
            setFailed(error.message);

            if (error.stack) {
                debug(`Stack trace: ${error.stack}`);
            }
        } else {
            setFailed("An unknown error occurred");
        }
    });
})();
