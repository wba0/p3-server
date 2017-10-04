const express = require('express');
const bcryptjs = require('bcryptjs');
const passport = require('passport');

const UserModel = require('../models/user-model');

const router = express.Router();

router.post('/process-signup', (req, res, next) => {
  if (!req.body.signupUsername || !req.body.signupPassword) {
    res.status(400).json({
      errorMessage: "We need both username and password."
    });
    return;
  }
  UserModel.findOne({
      username: req.body.signupUsername
    },
    (err, userFromDb) => {
      if (err) {
        res.status(500).json({
          errorMessage: "Error finding username."
        });
        return;
      }
      if (userFromDb) {
        res.status(400).json({
          errorMessage: "Username is taken."
        });
				return;
      }
      const salt = bcryptjs.genSaltSync(10);
      const hashPass = bcryptjs.hashSync(req.body.signupPassword, salt);

      const theUser = new UserModel({
        userName: req.body.signupUsername,
        encryptedPassword: hashPass
      });
      theUser.save((err) => {
				console.log("encryptedPassword", theUser.encryptedPassword)
				console.log("req body pass", req.body.signupPassword)
        if (err) {
          console.log("User save error: ", err)
          res.status(500).json({
            errorMessage: "Error saving user."
          });
          return;
        }

        req.login(theUser, (err) => {
          if (err) {
            console.log("User auto login error: ", err);
            res.status(500).json({
              errorMessage: "Error logging in"
            });
						return;
          }
          theUser.encryptedPassword = undefined;
          res.status(200).json(theUser);
        });
      });
    }
  );
});

router.post("/process-login", (req, res, next) => {
  const customAuthCallback = passport.authenticate(("local"), (err, theUser, extraInfo) => {
    if (err) {
      res.status(500).json({
        errorMesage: "login failed sorry"
      });
      return;
    }
    if (!theUser) {
      res.status(401).json({
        errorMesage: extraInfo.message
      });
      return;
    }
    req.login(theUser, (err) => {
      if (err) {
        res.status(500).json({
          errorMessage: "login failed"
        });
      }

      //clear out the password for security
      theUser.encryptedPassword = undefined;
      res.status(200).json(theUser);

    });
  });
  customAuthCallback(req, res, next);
});

router.delete("/logout", (req, res, next) => {
  req.logout();
  res.status(200).json({
    successMessage: "Log out success!"
  });
});

router.get("/checklogin", (req, res, next) => {
  let amILoggedIn = false;
  if (req.user) {
    req.user.encryptedPassword = undefined;
    amILoggedIn = true;
  }
  res.status(200).json({
    isLoggedIn: amILoggedIn,
    userInfo: req.user
  });
});

module.exports = router
