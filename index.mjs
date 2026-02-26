// This is a placeholder file to show how you can "mock" fetch requests using
// the nock library.
// You can delete the contents of the file once you have understood how it
// works.

/**
 * Handles form submission.
 *
 * @param {SubmitEvent} event
 */
async function handleSubmit(event) {
  event.preventDefault();

  clearError();

  if (!navigator.onLine) {
    showError("You are offline. Please check your internet connection.");
    return;
  }

  const input = document.querySelector("#usernames");
  const usernames = extractUsernames(input.value);

  if (usernames.length === 0) return;

  const { validUsers, invalidUsers } = await fetchUsers(usernames);

  if (validUsers.length === 0) {
    showError("No valid users found.");
    return;
  }

  if (invalidUsers.length > 0) {
    showError(`Invalid users: ${invalidUsers.join(", ")}`);
  }

  configureSelect(validUsers);
  renderTable(validUsers, "overall");
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
 * Fetches users and separates valid and invalid usernames.
 *
 * @param {string[]} usernames
 * @returns {Promise<{ validUsers: Object[], invalidUsers: string[] }>}
 */
async function fetchUsers(usernames) {
  const userEndpoint = "https://www.codewars.com/api/v1/users/";

  const results = await Promise.all(
    usernames.map(async (username) => {
      try {
        const response = await fetch(`${userEndpoint}${username}`);

        if (!response.ok) {
          return { username, error: true };
        }

        const json = await response.json();
        return { data: json };
      } catch {
        return { username, error: true };
      }
    }),
  );

  const validUsers = [];
  const invalidUsers = [];

  results.forEach((result) => {
    if (result.error) {
      invalidUsers.push(result.username);
    } else {
      validUsers.push(result.data);
    }
  });

  return { validUsers, invalidUsers };
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
 * Configures ranking select.
 *
 * @param {Object[]} users
 */
function configureSelect(users) {
  const select = document.querySelector("#ranking-select");
  select.innerHTML = "";
  select.disabled = false;

  const categories = new Set(["overall"]);

  users.forEach((user) => {
    const languages = user.ranks?.languages ?? {};
    Object.keys(languages).forEach((language) => categories.add(language));
  });

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    select.appendChild(option);
  });

  select.onchange = (event) => {
    renderTable(users, event.target.value);
  };
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
    .filter((user) => user.score !== null)
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

function showError(message) {
  document.querySelector("#error-message").textContent = message;
}

function clearError() {
  document.querySelector("#error-message").textContent = "";
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#leaderboard-form");
  form.addEventListener("submit", handleSubmit);
});
