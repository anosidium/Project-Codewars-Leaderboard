// This is a placeholder file to show how you can "mock" fetch requests using
// the nock library.
// You can delete the contents of the file once you have understood how it
// works.

/**
 * Handles form submission event.
 *
 * @param {SubmitEvent} event
 */
async function handleSubmit(event) {
  event.preventDefault();

  const input = document.querySelector("#usernames");
  const usernames = extractUsernames(input.value);

  if (usernames.length === 0) return;

  const users = await fetchUsers(usernames);

  const categories = extractRankingCategories(users);
  configureSelect(categories);

  renderTable(users, "overall");
}

/**
 * Extracts usernames from a comma-separated string.
 *
 * @param {string} rawInput
 * @returns {string[]} Cleaned usernames
 */
function extractUsernames(rawInput) {
  return rawInput
    .split(",")
    .map((username) => username.trim())
    .filter((username) => username.length > 0);
}

/**
 * Fetches Codewars user data for each username.
 *
 * @param {string[]} usernames
 * @returns {Promise<Object[]>} Array of user objects
 */
async function fetchUsers(usernames) {
  const userEndpoint = "https://www.codewars.com/api/v1/users/";

  const requests = usernames.map((username) =>
    fetch(`${userEndpoint}${username}`).then((response) => {
      if (!response.ok) {
        throw new Error(`User not found: ${username}`);
      }

      return response.json();
    }),
  );

  return Promise.all(requests);
}

/**
 * Extracts ranking categories from fetched users.
 *
 * @param {Object[]} users
 * @returns {string[]} Ranking categories
 */
function extractRankingCategories(users) {
  const categories = new Set();
  categories.add("overall");

  users.forEach((user) => {
    const languages = user.ranks?.languages ?? {};
    Object.keys(languages).forEach((language) => categories.add(language));
  });

  return Array.from(categories);
}

/**
 * Configures the ranking select control.
 *
 * @param {string[]} categories
 */
function configureSelect(categories) {
  const select = document.querySelector("#ranking-select");
  select.innerHTML = "";

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    select.appendChild(option);
  });

  select.addEventListener("change", async (event) => {
    const selected = event.target.value;
    const input = document.querySelector("#usernames");
    const usernames = extractUsernames(input.value);
    const users = await fetchUsers(usernames);
    renderTable(users, selected);
  });
}

/**
 * Renders leaderboard table.
 *
 * @param {Object[]} users
 * @param {string} rankingType
 */
function renderTable(users, rankingType) {
  const tbody = document.querySelector("#leaderboard-table tbody");
  tbody.innerHTML = "";

  const ranked = users
    .map((user) => ({
      username: user.username,
      clan: user.clan ?? "",
      score: getScore(user, rankingType),
    }))
    .filter((u) => u.score !== null)
    .sort((a, b) => b.score - a.score);

  ranked.forEach((user) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${user.username}</td>
      <td>${user.clan}</td>
      <td>${user.score}</td>
    `;

    tbody.appendChild(row);
  });
}

/**
 * Retrieves score for given ranking type.
 *
 * @param {Object} user
 * @param {string} rankingType
 * @returns {number|null}
 */
function getScore(user, rankingType) {
  if (rankingType === "overall") {
    return user.ranks?.overall?.score ?? 0;
  }

  return user.ranks?.languages?.[rankingType]?.score ?? null;
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#leaderboard-form");
  form.addEventListener("submit", handleSubmit);
});
