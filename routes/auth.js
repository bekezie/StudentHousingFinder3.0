let express = require("express");
let router = express.Router();
let studenthousingDB = require("../db/myMongoDB.js");

router.post("/registerOwner", async (req, res) => {
  //this route will handle registering a user to the database

  // we will first check if the username already exists
  let duplicateUsername = await studenthousingDB.getUserByUsername(
    req.body.username
  );
  console.log(duplicateUsername);
  if (duplicateUsername != undefined) {
    //res.send({ registered: false });
    res.redirect("/owner?=username_already_taken");
  } else {
    //set authorID to unqiue id
    let newUserObj = {
      username: req.body.username,
      password: req.body.password,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
    };

    console.log(newUserObj);
    await studenthousingDB.createNewOwner(newUserObj);

    if (newUserObj != undefined) {
      res.redirect("/");
    } else {
      // send a false response to the frontend if something went wrong with the registration
      //res.send({ registered: false });
      res.redirect("/owner");
    }
  }
});

router.post("/registerStudent", async (req, res) => {
  //this route will handle registering a user to the database

  //we will first check if the username already exists
  let duplicateUsername = await studenthousingDB.getUserByUsername(
    req.body.username
  );
  console.log(duplicateUsername);
  if (duplicateUsername != undefined) {
    //res.send({ registered: false });
    res.redirect("/student?=username_already_taken");
  } else {
    let newUserObj = {
      username: req.body.username,
      password: req.body.password,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      schoolID: req.body.schoolID,
      semester: req.body.semester,
      year: req.body.year,
      budget: req.body.budget,
    };
    console.log(newUserObj);
    await studenthousingDB.createNewStudent(newUserObj);

    if (newUserObj != undefined) {
      res.redirect("/");
    } else {
      // send a false response to the frontend if something went wrong with the registration
      //res.send({ registered: false });
      res.redirect("/student");
    }
  }
});

module.exports = router;
