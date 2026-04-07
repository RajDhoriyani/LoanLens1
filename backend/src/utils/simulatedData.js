const {
  UPI_CATEGORIES,
  ENTERTAINMENT_SUBSCRIPTIONS,
} = require("../config/constants");

/**
 * Generate a random number between min and max (inclusive).
 */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate 20 simulated UPI transactions.
 */
function generateUPITransactions(income = 50000) {
  const transactions = [];
  const now = new Date();

  for (let i = 0; i < 20; i++) {
    const isCredit = Math.random() < 0.3; // ~30% credits
    const type = isCredit ? "credit" : "debit";

    let amount;
    if (isCredit) {
      // Credits are usually salary-ish or transfers
      amount = randInt(5000, Math.max(income * 0.8, 10000));
    } else {
      // Debits are daily spending
      amount = randInt(50, Math.min(income * 0.15, 15000));
    }

    const category = isCredit
      ? pickRandom(["salary", "transfer", "investment"])
      : pickRandom(UPI_CATEGORIES.filter((c) => !["salary"].includes(c)));

    const date = new Date(now);
    date.setDate(date.getDate() - randInt(0, 30));

    transactions.push({ amount, type, category, date });
  }

  // Sort by date descending
  return transactions.sort((a, b) => b.date - a.date);
}

/**
 * Generate entertainment subscriptions.
 */
function generateEntertainmentSubscriptions() {
  const count = randInt(1, 5);
  const shuffled = [...ENTERTAINMENT_SUBSCRIPTIONS].sort(
    () => 0.5 - Math.random()
  );
  const selected = shuffled.slice(0, count);

  const costMap = {
    Netflix: 649,
    Spotify: 119,
    "Amazon Prime": 299,
    "Disney+ Hotstar": 299,
    "YouTube Premium": 149,
    "Apple Music": 99,
    JioCinema: 99,
    SonyLIV: 299,
    Zee5: 99,
    Audible: 199,
  };

  return selected.map((name) => ({
    name,
    monthly_cost: costMap[name] || randInt(99, 499),
    active: Math.random() > 0.15,
  }));
}

/**
 * Generate social media usage stats.
 */
function generateSocialMediaUsage() {
  return [
    {
      platform: "Instagram",
      usage_hours_per_day: randFloat(0.5, 6.0, 1),
    },
  ];
}

/**
 * Generate complete simulated data object.
 */
function generateSimulatedData(income) {
  return {
    upi_transactions: generateUPITransactions(income),
    entertainment_subscriptions: generateEntertainmentSubscriptions(),
    social_media_usage: generateSocialMediaUsage(),
  };
}

module.exports = {
  generateSimulatedData,
  generateUPITransactions,
  generateEntertainmentSubscriptions,
  generateSocialMediaUsage,
  randInt,
  randFloat,
};
