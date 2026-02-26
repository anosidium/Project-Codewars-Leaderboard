// This is a placeholder file which shows how you use the nock library to
// "mock" fetch requests, replacing real requests with fake ones that you
// control in the test. This means you can "force" the fetch request to return
// data in the format that you want.
// IMPORTANT: You _must_ run npm install within the Project-Codewars-Leaderboard
// folder for this to work.
// You can change or delete the contents of the file once you have understood
// how it works.

import test from "node:test";
import assert from "node:assert";
import nock from "nock";
import { fetchUsers } from "./index.mjs";

const BASE_URL = "https://www.codewars.com";

test("fetchUsers returns a valid user when API responds with 200", async () => {
  const mockUser = {
    username: "ValidUser",
    clan: "TestClan",
    ranks: {
      overall: { score: 100 },
      languages: {},
    },
  };

  const scope = nock(BASE_URL).get("/api/v1/users/ValidUser").reply(200, mockUser);

  const result = await fetchUsers(["ValidUser"]);

  assert.strictEqual(result.validUsers.length, 1);
  assert.strictEqual(result.invalidUsers.length, 0);
  assert.strictEqual(result.validUsers[0].username, "ValidUser");

  assert(scope.isDone(), "Expected API call was not made");
});

test("fetchUsers classifies 404 user as invalid", async () => {
  const scope = nock(BASE_URL).get("/api/v1/users/UnknownUser").reply(404);

  const result = await fetchUsers(["UnknownUser"]);

  assert.strictEqual(result.validUsers.length, 0);
  assert.strictEqual(result.invalidUsers.length, 1);
  assert.strictEqual(result.invalidUsers[0], "UnknownUser");

  assert(scope.isDone(), "Expected API call was not made");
});

test("fetchUsers separates valid and invalid users correctly", async () => {
  const validUser = {
    username: "ValidUser",
    clan: null,
    ranks: {
      overall: { score: 50 },
      languages: {},
    },
  };

  const scope = nock(BASE_URL).get("/api/v1/users/ValidUser").reply(200, validUser).get("/api/v1/users/BadUser").reply(404);

  const result = await fetchUsers(["ValidUser", "BadUser"]);

  assert.strictEqual(result.validUsers.length, 1);
  assert.strictEqual(result.invalidUsers.length, 1);

  assert.strictEqual(result.validUsers[0].username, "ValidUser");
  assert.strictEqual(result.invalidUsers[0], "BadUser");

  assert(scope.isDone(), "Not all mocked endpoints were called");
});
