const bcrypt = require("bcryptjs");

const password = "TestPassword123";
const hash = bcrypt.hashSync(password, 10);

console.log("Password:", password);
console.log("Hash:", hash);
console.log("\nCopy the hash above and use it in the next step!");
