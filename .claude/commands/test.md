Run the server test suite and report the results.

Steps:
1. Run `cd server && npm test -- --verbose`
2. For each suite, list the suite name, then every test name with ✅ or ❌ next to it
3. For any failures, show the test name, the expected value, and the received value
4. Fo any failures, list out the potential root cause of the error and what changes would be needed to fix them.
5. End with a one-line summary: total suites, total tests, pass count, fail count
