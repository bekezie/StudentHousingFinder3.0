let express = require("express");
let router = express.Router();
let studentHousingDB = require("../db/myMongoDB.js");

// save a session for app
let session;

/* GET home page. */
router.get("/", async function (req, res) {
  console.log("Attempting GET /");
  // console.log("Attempting searches for GET /");

  const listings = await studentHousingDB.getListings();
  // console.log(listings);
  // console.log("got listings");

  session = req.session;

  if (session.userid) {
    // console.log("got session " + session.userid);

    let user = await studentHousingDB.getUserByUsername(session.userid);
    // console.log("got user", user);

    if (user.authorID != undefined) {
      //const authorID = owner.authorID;
      const authorID = user.authorID;
      // console.log("owner session: ", req.session);
      const ownerListings = await studentHousingDB.getListingsByAuthorID(
        authorID
      );
      console.log("render ownerHomePage");
      res.render("ownerHomePage", {
        title: "StudentHousingFinderOwnerHome",
        listings: ownerListings,
        username: user.username,
        authorID: authorID,
      });
    } else {
      console.log("render studentHomePage");
      res.render("studentHomePage", {
        title: "StudentHousingFinderStudentHome",
        listings: listings,
        username: user.username,
        student: user.username,
      });
    }
  } else {
    console.log("render index");
    res.render("index", {
      title: "StudentHousingFinderHome",
      listings: listings,
    });
  }
});

// After user logs in, render page depending on owner/student status
router.post("/user", async function (req, res) {
  console.log("**attempting POST /user");

  // const listings = await studentHousingDB.getListings();
  // console.log("got listings");
  session = req.session;
  session.userid = req.body.username;

  const user = await studentHousingDB.getUserByUsername(session.userid);
  // console.log("got user", user);
  // const username = user.username;
  // const owner = await studentHousingDB.getOwnerByUsername(username);
  // console.log("got owner", owner);
  // const student = await studentHousingDB.getOwnerByUsername(user);

  if (req.body.password == user.password) {
    res.redirect("/");
  }
});

/* GET search page. */
router.post("/search/Listing", async function (req, res) {
  // console.log("Attempting GET /");
  console.log("Attempting searches for POST /search/Listing");

  let criteria = req.body;
  let search = {
    location: criteria.location,
    sizeInSqFt: criteria.sizeInSqFt,
    unitType: criteria.unitType,
    rentPerMonth: criteria.rentPerMonth,
    description: criteria.description,
    openingDate: criteria.openingDate,
    leaseInMonths: criteria.leaseInMonths,
    available: criteria.available,
  };
  console.log(search);
  const listings = await studentHousingDB.searchListings(search);
  console.log("got listings");

  session = req.session;

  if (session.userid) {
    console.log("got session " + session.userid);

    let user = await studentHousingDB.getUserByUsername(session.userid);
    // console.log("got user", user);

    if (user.authorID != undefined) {
      let authorID = user.authorID;
      console.log("owner session: ", req.session);
      let ownerListings = await studentHousingDB.getListingsByAuthorID(
        authorID
      );

      // console.log("render ownerHomePage ");
      res.render("ownerHomePage", {
        title: "StudentHousingFinderOwnerHome",
        listings: ownerListings,
        username: user.username,
        authorID: authorID,
      });
    } else {
      // const student = await studentHousingDB.getStudentByUsername(
      //   user.username
      // );
      // console.log("got student", student);

      console.log("render studentHomePage ");
      try {
        res.render("studentHomePage", {
          title: "StudentHousingFinderStudentHome",
          listings: listings,
          username: user.username,
          student: user.firstName,
        });
      } catch (err) {
        console.log("failed to render");
      }
    }
  } else {
    // console.log("render index");
    res.render("index", {
      title: "StudentHousingFinderHome",
      listings: listings,
    });
  }
});

/* GET logout. */
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

/* GET register. */
router.get("/register", function (req, res) {
  res.render("registerPage");
});

/* GET ownerRegister. */
router.get("/owner", function (req, res) {
  res.render("ownerRegisterPage");
});

/* GET studentRegister. */
router.get("/student", function (req, res) {
  res.render("studentRegisterPage");
});

// /* POST create listing. */
router.post("/listings/create", async function (req, res) {
  console.log("**attempting POST listings/create");
  session = req.session;

  const listing = req.body;
  // console.log("create listing", listing);
  const user = await studentHousingDB.getUserByUsername(session.userid);
  // console.log("got user", user);
  // const owner = await studentHousingDB.getOwnerByUsername(user.username);
  // console.log("got owner", owner);
  //const authorID = owner.authorID;
  const authorID = user.authorID;
  session.authorID = authorID;
  // console.log("got authorID", session.authorID);

  try {
    await studentHousingDB.createListing(listing, authorID);
    // console.log("Listing created");
  } catch (err) {
    // console.log("Listing not created");
  }

  session = req.session;

  res.redirect("/");
});

// /* POST create rating. */
router.post("/createRating", async function (req, res) {
  // console.log("**attempting POST createRating");
  session = req.session;
  let rateInt = parseInt(req.body.rating, 10);
  const rating = {
    rating: rateInt,
    listingID: req.body.listingID,
    user: session.userid,
  };

  // console.log(rating);
  try {
    await studentHousingDB.createRating(rating);
    // console.log("rating created");
  } catch (err) {
    // console.log("rating not created");
  }
  session = req.session;
  // console.log("update listing session", session);
  res.redirect("listings/" + req.body.listingID);
});

// /* POST update Rating. */
router.post("/updateRating", async function (req, res) {
  // console.log("**attempting POST ratings/update");
  session = req.session;
  let rateInt = parseInt(req.body.rating, 10);
  const updatedrating = {
    rating: rateInt,
    listingID: req.body.listingID,
    raterID: session.userid,
  };
  // console.log(updatedrating);

  try {
    await studentHousingDB.updateRating(updatedrating);
    // console.log("Listing updated", updatedrating);
  } catch (err) {
    // console.log("Listing not updated");
  }

  session = req.session;
  // console.log("update listing session", session);

  // console.log("POST update listing", listing);
  // console.log("update listing session", session);
  res.redirect("listings/" + req.body.listingID);
});

// /* GET listing details page. */
router.get("/listings/:listingID", async function (req, res) {
  // console.log("**attempting GET listing details");

  session = req.session;

  if (session.userid != undefined) {
    const listingID = req.params.listingID;

    // console.log("Got listing details ", listingID);

    const listing = await studentHousingDB.getListingByID(listingID);
    // console.log("Got listing by ID ", listing);

    // const studObj = {
    //   listingID: listingID,
    //   user: session.userid,
    // };
    // console.log("listingID, user: ", listingID, session.userid);

    const rating = await studentHousingDB.getRatingByIDS(
      listing.listingID,
      session.userid
    );

    console.log("authorID:", parseInt(listing.authorID));
    const owner = await studentHousingDB.getOwnerByAuthorID(listing.authorID);
    console.log("Got owner ", owner);
    const msgs = await studentHousingDB.getMessages(
      session.userid,
      owner.username,
      listing.listingID
    );

    let time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (time.substring(0, 1) == 0) {
      time = time.substring(1);
    }

    res.render("listingDetailsPage", {
      listing,
      username: session.userid,
      rating,
      owner,
      time,
      msgs,
    });
  } else {
    res.redirect("/");
  }
});

/* GET Update listing details. */
router.get("/listings/update/:listingID", async function (req, res) {
  console.log("**attempting POST listings/update/ID");

  const listingID = req.params.listingID;
  // console.log("Got listing details ", listingID);

  const listing = await studentHousingDB.getListingByID(listingID);
  console.log("Listing updated");
  // console.log("here is the Listing! ", listing);

  session = req.session;
  // console.log("session.userid: ", session);

  res.render("listingUpdatePage", {
    listing: listing,
    username: session.userid,
  });
});

/* POST update listing. */
router.post("/listings/update", async function (req, res) {
  // console.log("**attempting POST listings/update");

  const listing = req.body;
  // console.log("POST update listing", listing);

  try {
    await studentHousingDB.updateListing(listing);
    console.log("Listing updated");
  } catch (err) {
    console.log("Listing not updated: ", err);
  }

  session = req.session;
  // console.log("update listing session", session);

  res.redirect("/");
});

// /* POST delete listing. */
router.post("/listings/delete", async function (req, res) {
  // console.log("**attempting POST delete listing");

  const listingID = req.body.listingID;
  // console.log(listingID);
  // console.log("delete listing", listingID);
  session = req.session;

  try {
    await studentHousingDB.deleteListing(listingID);
    // console.log("Listing deleted");
  } catch (err) {
    // console.log("Listing not deleted");
  }

  res.redirect("/");
});

/* POST send message. */
router.post("/message/create", async function (req, res) {
  // console.log("Got post message/create");

  const msg = req.body;
  console.log("Got create message", msg);
  try {
    await studentHousingDB.createMessage(msg);
    // console.log("Message created");
  } catch (err) {
    // console.log("Message not created:" + err);
  }

  res.redirect("/listings/" + msg.listingID);
});

/* POST delete message. */
router.post("/message/delete", async function (req, res) {
  // console.log("Got post message/delete");

  const msg = req.body;
  // console.log("Got delete message", msg);
  try {
    await studentHousingDB.deleteMessage(msg);
    console.log("Message deleted");
  } catch (err) {
    console.log("Message not deleted:" + err);
  }

  res.redirect("/listings/" + msg.listingID);
});

/* POST delete message. */
router.post("/message/owner/delete", async function (req, res) {
  // console.log("Got post message/delete");

  const msg = req.body;
  // console.log("Got delete message", msg);
  try {
    await studentHousingDB.deleteMessage(msg);
    // console.log("Message deleted");
  } catch (err) {
    // console.log("Message not deleted:" + err);
  }

  res.redirect("/message/" + msg.username);
});

/* POST view message. */
router.post("/message/view", async function (req, res) {
  // console.log("**attempting POST message/view");

  res.redirect("/message/" + req.body.username);
});

/* GET owner's messages page. */
router.get("/message/:username", async function (req, res) {
  // console.log("**attempting GET owner's messages page");

  const username = req.params.username;
  // console.log("Got username", username);

  const msgs = await studentHousingDB.getAllMessages(username);
  // console.log("Got messages");

  let time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (time.substring(0, 1) == 0) {
    time = time.substring(1);
  }

  res.render("ownerMessagesPage", {
    username,
    msgs,
    time,
  });
});

/* POST reply message. */
router.post("/message/reply", async function (req, res) {
  // console.log("**attempting POST message/view");

  const msg = req.body;
  // console.log("create message", msg);
  try {
    await studentHousingDB.createMessage(msg);
    // console.log("Message replied");
  } catch (err) {
    // console.log("Message not replied:" + err);
  }

  res.redirect("/message/" + req.body.sender);
});

module.exports = router;
