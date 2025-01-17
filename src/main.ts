import { ExitCode } from "@actions/core";
import { runner } from "./runner";
import { log } from "./util";

void (async (): Promise<void> => {
    await runner().catch((error: unknown) => {
        if (error instanceof Error) {
            process.exitCode = ExitCode.Failure;
            log(error.message, "error");
        }
    });
})();
