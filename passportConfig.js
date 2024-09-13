const LocalStrategy = require("passport-local").Strategy;
const { authenticate } = require("passport");
const bcrypt = require("bcrypt");
const client = require("./db/conn.js");

function initialize(passport) {
  const authenticateUser = async (email, password, done) => {
    client.query(
      `SELECT * FROM users WHERE email =$1`,
      [email],
      (err, results) => {
        if (err) {
          throw err;
        }
        // console.log(results.rows)

        if (results.rows.length > 0) {
          const user = results.rows[0];

          bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
              console.log(err);
            }
            if (isMatch) {
              return done(null, user);
            } else {
              //password is incorrect
              return done(null, false, { message: "Password is incorrect" });
            }
          });
        } else {
          return done(null, false, { message: "email is not registered" });
        }
      }
    );
  };

  passport.use(
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      authenticateUser
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  passport.deserializeUser((id, done) => {
    client.query(`SELECT * FROM users WHERE id=$1`, [id], (err, results) => {
      if (err) {
        throw err;
      }
      return done(null, results.rows[0]);
    });
  });
}

module.exports = initialize;
