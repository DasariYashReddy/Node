const express = require("express");
const app = express();
const path = require("path");
const sqlite = require("sqlite3");
const { open } = require("sqlite");
const bcrypt = require("bcrypt");
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");
let db = null;

async function dbStart() {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite.Database,
    });
    app.listen(3000, () => {
      console.log("Server started on http://3000");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
}
dbStart();

///Registering User API
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  let hashedPassword = await bcrypt.hash(password, 10);
  const userResp = await db.get(
    `SELECT * FROM user WHERE username='${username}'`
  );
  if (userResp === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createUserQuery = `
      INSERT INTO 
        user (username, name, password, gender, location) 
      VALUES 
        (
          '${username}', 
          '${name}',
          '${hashedPassword}', 
          '${gender}',
          '${location}'
        )`;
      db.run(createUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

///Login API
app.post("/login", async (request, response) => {
  const { username, password } = request.body;

  const userStatus = await db.get(
    `SELECT * FROM user WHERE username ='${username}'; `
  );
  if (userStatus !== undefined) {
    if (await bcrypt.compare(password, userStatus.password)) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  } else {
    response.status(400);
    response.send("Invalid user");
  }
});

///Change Password API
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const userRecord = await db.get(
    `SELECT * FROM user WHERE username = '${username}';`
  );
  console.log(userRecord);
  if (await bcrypt.compare(oldPassword, userRecord.password)) {
    if (oldPassword.length > 5) {
      const newPw = await bcrypt.hash(newPassword, 10);
      await db.run(
        ` UPDATE user SET password='${newPw}' WHERE username = '${username}';`
      );
      response.status(200);
      response.send("Password updated");
    } else {
      response.status(400);
      response.send("Password too short");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
