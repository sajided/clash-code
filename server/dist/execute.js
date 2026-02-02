import axios from "axios";
const PISTON_API_URL = process.env.PISTON_API_URL ?? "https://emkc.org/api/v2/piston";
const PISTON_STATUS_TO_VERDICT = {
    RE: "Runtime Error",
    SG: "Runtime Error",
    TO: "TLE",
    OL: "Wrong Answer",
    EL: "Runtime Error",
    XX: "Runtime Error",
};
function normalizeOutput(s) {
    return (s ?? "").replace(/\r\n/g, "\n").trim();
}
async function runSingleTest(sourceCode, input, expectedOutput, language = "cpp") {
    try {
        const isC = language === "c";
        const res = await axios.post(`${PISTON_API_URL}/execute`, {
            language: isC ? "c" : "c++",
            version: "*",
            files: [{ name: isC ? "main.c" : "main.cpp", content: sourceCode }],
            stdin: input,
            run_timeout: 5000,
        }, {
            headers: { "Content-Type": "application/json" },
            timeout: 15000,
        });
        const data = res.data;
        const compile = data.compile;
        const runResult = data.run;
        if (compile && compile.code !== 0) {
            return { accepted: false, verdict: "Compilation Error" };
        }
        if (!runResult) {
            return { accepted: false, verdict: "Runtime Error" };
        }
        if (runResult.status) {
            const verdict = PISTON_STATUS_TO_VERDICT[runResult.status] ?? "Runtime Error";
            return { accepted: false, verdict };
        }
        const stdout = normalizeOutput(runResult.stdout ?? runResult.output ?? "");
        const expected = normalizeOutput(expectedOutput);
        const accepted = stdout === expected;
        return {
            accepted,
            verdict: accepted ? "Accepted" : "Wrong Answer",
        };
    }
    catch (err) {
        if (axios.isAxiosError(err)) {
            console.warn("Piston API error:", err.message);
        }
        return { accepted: false, verdict: "Wrong Answer" };
    }
}
export async function executeCode(sourceCode, sampleTests, language = "cpp") {
    if (sampleTests.length === 0) {
        return { accepted: false, verdict: "Wrong Answer" };
    }
    for (const test of sampleTests) {
        const result = await runSingleTest(sourceCode, test.input, test.expectedOutput, language);
        if (!result.accepted) {
            return result;
        }
    }
    return { accepted: true, verdict: "Accepted" };
}
