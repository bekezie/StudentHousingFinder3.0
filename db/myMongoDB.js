const { MongoClient, ObjectId } = require("mongodb");
const { createClient } = require("redis");
/*
 ***************Student and Owner CRUD OPERATIONS*********************
 */

let StudentHousingDBController = function () {
  let studentHousingDB = {};
  const uri = process.env.MONGO_URL || "mongodb://localhost:27017";
  const DB_NAME = "project2";

  // Initialize DB by importing csv with entries to localhost
  // studentHousingDB.initializeDB = async () => {
  //   let client;
  //   try {
  //     client = new MongoClient(uri, {
  //       useUnifiedTopology: true,
  //       useNewUrlParser: true,
  //     });

  //     await client.connect();
  //     const db = client.db(DB_NAME);
  //     const usersCollection = db.collection("users");
  //     const listingsCollection = db.collection("listings");
  //     // const insertResult = await usersCollection;
  //     // return insertResult.insertedCount;
  //   } finally {
  //     client.close();
  //   }
  // };

  //this function will save a new user to the database
  studentHousingDB.createNewOwner = async newUser => {
    let client;
    try {
      client = new MongoClient(uri, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
      });

      await client.connect();
      const db = client.db(DB_NAME);
      const usersCollection = db.collection("users");
      const max = await usersCollection
        .aggregate([
          {
            $group: {
              _id: "$_id",
              count: {
                $max: "$authorID",
              },
            },
          },
        ])
        .sort({ count: -1 })
        .limit(1)
        .toArray();

      let authorID = 1 + parseInt(max[0].count, 10);

      // console.log(authorID);
      const newOwner = {
        username: newUser.username,
        password: newUser.password,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        authorID: authorID,
      };
      const insertResult = await usersCollection.insertOne(newOwner);
      return insertResult.insertedCount;
    } finally {
      client.close();
    }
  };

  studentHousingDB.createNewStudent = async newUser => {
    let client;
    try {
      client = new MongoClient(uri, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
      });

      await client.connect();
      const db = client.db(DB_NAME);
      const usersCollection = db.collection("users");
      const insertResult = await usersCollection.insertOne(newUser);
      return insertResult.insertedCount;
    } finally {
      client.close();
    }
  };

  studentHousingDB.getOwnerByAuthorID = async authorID => {
    let client;

    try {
      client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      await client.connect();
      const db = client.db(DB_NAME);
      const usersCollection = db.collection("users");
      // we will be using the user's email as their username
      const queryResult = await usersCollection.findOne({
        authorID: authorID,
      });
      // console.log(queryResult);
      return queryResult;
    } catch (err) {
      console.log(err);
    } finally {
      // we have to close the database connection otherwise we will overload the mongodb service.
      await client.close();
    }
  };

  // this function will query the database for a user object by using an username string
  studentHousingDB.getUserByUsername = async query => {
    let client;
    try {
      client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      await client.connect();
      const db = client.db(DB_NAME);
      const usersCollection = db.collection("users");
      // we will be using the user's email as their username
      const queryResult = await usersCollection.findOne({
        username: query,
      });
      // console.log(queryResult);
      return queryResult;
    } finally {
      // we have to close the database connection otherwise we will overload the mongodb service.
      await client.close();
    }
  };

  // this function will query the database for a user object by using an username string and password
  studentHousingDB.getUserCred = async user => {
    let client;
    try {
      client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      await client.connect();
      const db = client.db(DB_NAME);
      const usersCollection = db.collection("users");
      // we will be using the user's email as their username
      const queryResult = await usersCollection
        .findOne({
          username: user.username,
          password: user.password,
        })
        .toArray();
      return queryResult;
    } finally {
      // we have to close the database connection otherwise we will overload the mongodb service.
      await client.close();
    }
  };

  //  /*
  //  ***************Listing CRUD OPERATIONS*********************
  //  */
  // // create new Listing
  studentHousingDB.createListing = async (newListing, authorID) => {
    let client;
    const redisClient = createClient();

    try {
      client = new MongoClient(uri, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
      });

      await client.connect();
      await redisClient.connect();
      const db = client.db(DB_NAME);
      const listingsCollection = db.collection("listings");

      let max = await listingsCollection
        .aggregate([
          {
            $group: {
              _id: "$_id",
              count: {
                $max: "$listingID",
              },
            },
          },
        ])
        .sort({ count: -1 })
        .limit(1)
        .toArray();
      // console.log(max);
      // console.log(parseInt(max[0].count, 10));

      let listingID = 1 + parseInt(max[0].count, 10);
      // console.log(listingID);
      if (newListing.available == "true") {
        newListing.available = true;
      } else {
        newListing.available = false;
      }

      const newListingToAdd = {
        listingID: listingID.toString(),
        title: newListing.title,
        location: newListing.location,
        unitType: newListing.unitType,
        sizeInSqFt: parseInt(newListing.sizeInSqFt),
        rentPerMonth: parseInt(newListing.rentPerMonth),
        description: newListing.description,
        openingDate: newListing.openingDate,
        leaseInMonths: parseInt(newListing.leaseInMonths),
        available: newListing.available,
        authorID: authorID,
      };
      let sortedListing = await redisClient.zRange("rankedListings", 0, -1);
      //console.log(sortedListing);
      if (sortedListing.length > 0) {
        await redisClient.incr("score");
        let score = await redisClient.get("score");
        await redisClient.hSet(`listing:${listingID}:${authorID}`, {
          listingID: `${listingID}`,
          title: newListing.title,
          location: newListing.location,
          unitType: newListing.unitType,
          sizeInSqFt: newListing.sizeInSqFt,
          rentPerMonth: newListing.sizeInSqFt,
          description: newListing.description,
          openingDate: newListing.openingDate,
          leaseInMonths: `${newListing.leaseInMonths}`,
          available: newListing.available,
          authorID: `${authorID}`,
          avgRating: "null",
          score: score,
        });
      }

      const insertResult = await listingsCollection.insertOne(newListingToAdd);
      return insertResult.insertedCount;
    } finally {
      client.close();
    }
  };

  // get all Listings , may implement pagination later
  studentHousingDB.getListings = async () => {
    let mongoClient, redisClient;
    try {
      mongoClient = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      await mongoClient.connect();
      const db = mongoClient.db(DB_NAME);
      const listingsCollection = db.collection("listings");

      redisClient = createClient();
      await redisClient.connect();

      const queryResult = await listingsCollection
        .aggregate([
          {
            $sort: {
              listingID: -1,
            },
          },
          {
            $addFields: {
              avgRating: { $avg: "$rating.rating" },
            },
          },
        ])
        .toArray();
      return queryResult;
    } catch (err) {
      console.log(err);
    } finally {
      // we have to close the database connection otherwise we will overload the mongodb service.
      await mongoClient.close();
    }
  };

  // // get available Listings
  studentHousingDB.getAvailableListings = async () => {
    let mongoClient, redisClient;
    try {
      mongoClient = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      await mongoClient.connect();
      const db = mongoClient.db(DB_NAME);
      const listingsCollection = db.collection("listings");

      redisClient = createClient();
      await redisClient.connect();

      // delete if already exists
      await redisClient.del("availableListings");
      await redisClient.del("unavailableListings");

      await listingsCollection.find().forEach(async function (listing) {
        let avgRating = await redisClient.hGet(
          `listing:${listing.listingID}:${listing.authorID}`,
          "avgRating"
        );
        console.log("avgRating", avgRating);
        await redisClient.hSet(`listing:${listing.listingID}`, {
          listingID: `${listing.listingID}`,
          title: listing.title,
          location: listing.location,
          unitType: listing.unitType,
          sizeInSqFt: listing.sizeInSqFt,
          rentPerMonth: listing.sizeInSqFt,
          description: listing.description,
          openingDate: listing.openingDate,
          leaseInMonths: `${listing.leaseInMonths}`,
          available: listing.available,
          authorID: `${listing.authorID}`,
          avgRating: avgRating,
        });
      });

      await listingsCollection.find().forEach(async function (listing) {
        if (listing.available) {
          await redisClient.rPush("availableListings", `${listing.listingID}`);
        } else {
          await redisClient.rPush(
            "unavailableListings",
            `${listing.listingID}`
          );
        }
      });

      let listings = [];

      let availableIDs = await redisClient.lRange("availableListings", 0, -1);
      // console.log("available", availableIDs);
      for (let i = 0; i < (await redisClient.lLen("availableListings")); i++) {
        let listing = await redisClient.hGetAll(`listing:${availableIDs[i]}`);
        // console.log(`listing:${availableIDs[i]}: `, listing);
        if (listing.listingID == availableIDs[i]) {
          listings.push(JSON.parse(JSON.stringify(listing)));
        }
      }
      console.log("available listings: ", listings);
      return listings;
    } catch (err) {
      console.log("available unsuccessful", err);
    } finally {
      redisClient.quit();
    }
  };

  // // get unavailable Listings
  studentHousingDB.getUnavailableListings = async authorID => {
    let mongoClient, redisClient;
    try {
      mongoClient = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      await mongoClient.connect();
      const db = mongoClient.db(DB_NAME);
      const listingsCollection = db.collection("listings");

      redisClient = createClient();
      await redisClient.connect();

      // delete if already exists
      await redisClient.del("availableListings");
      await redisClient.del("unavailableListings");

      await listingsCollection.find().forEach(async function (listing) {
        await redisClient.hSet(`listing:${listing.listingID}`, {
          listingID: `${listing.listingID}`,
          title: listing.title,
          location: listing.location,
          unitType: listing.unitType,
          sizeInSqFt: listing.sizeInSqFt,
          rentPerMonth: listing.sizeInSqFt,
          description: listing.description,
          openingDate: listing.openingDate,
          leaseInMonths: `${listing.leaseInMonths}`,
          available: listing.available,
          authorID: `${listing.authorID}`,
          avgRating: `${listing.avgRating}`,
        });
      });

      await listingsCollection.find().forEach(async function (listing) {
        if (listing.available) {
          await redisClient.rPush("availableListings", `${listing.listingID}`);
        } else {
          await redisClient.rPush(
            "unavailableListings",
            `${listing.listingID}`
          );
        }
      });

      let unavailableListings = [];

      let unavailableIDs = await redisClient.lRange(
        "unavailableListings",
        0,
        -1
      );
      // console.log("unavailable", unavailableIDs);
      for (
        let i = 0;
        i < (await redisClient.lLen("unavailableListings"));
        i++
      ) {
        let listing = await redisClient.hGetAll(
          `listing:${unavailableIDs[i]}:${authorID}`
        );
        console.log(`listing:${unavailableIDs[i]}: `, listing);
        if (
          listing.listingID == unavailableIDs[i] &&
          listing.authorID == authorID
        ) {
          unavailableListings.push(JSON.parse(JSON.stringify(listing)));
        }
      }
      console.log("unavailable listings: ", unavailableListings);
      return unavailableListings;
    } catch (err) {
      console.log("available unsuccessful", err);
    } finally {
      redisClient.quit();
    }
  };

  // get all Listings , may implement pagination later
  studentHousingDB.getRankedListings = async () => {
    let client;
    try {
      client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      await client.connect();
      const db = client.db(DB_NAME);
      const listingsCollection = db.collection("listings");
      // we will be using the user's email as their username
      const queryResult = await listingsCollection
        .aggregate([
          {
            $addFields: {
              avgRating: { $avg: "$rating.rating" },
            },
          },
          {
            $sort: {
              avgRating: -1,
            },
          },
        ])
        .toArray();
      return queryResult;
    } catch (err) {
      console.log(err);
    } finally {
      // we have to close the database connection otherwise we will overload the mongodb service.
      await client.close();
    }
  };

  studentHousingDB.getRatingByIDS = async (listingID, user) => {
    let client;
    try {
      client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      await client.connect();
      const db = client.db(DB_NAME);
      const listingsCollection = db.collection("listings");
      console.log(`attempting to get listing with ${listingID}`);

      const queryResult = await listingsCollection
        .aggregate([
          {
            $match: {
              listingID: parseInt(listingID),
              //"rating.raterID": user,
            },
          },
          {
            $project: {
              rating: {
                $filter: {
                  input: "$rating",
                  as: "item",
                  cond: { $eq: ["$$item.raterID", user] },
                },
              },
            },
          },
        ])
        .toArray();

      // console.log(`got listing with ${listingID}`);

      return queryResult[0].rating;
    } catch (err) {
      console.log(`unsuccessful get listing with ${listingID}`, err);
    } finally {
      // we have to close the database connection otherwise we will overload the mongodb service.
      await client.close();
    }
  };

  // search Listings , may implement pagination later
  studentHousingDB.searchListings = async (criteria, search) => {
    let mongoClient;
    try {
      mongoClient = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      await mongoClient.connect();
      const db = mongoClient.db(DB_NAME);
      const listingsCollection = db.collection("listings");
      if (criteria != undefined) {
        let filter, sort;
        if (criteria == "title") {
          filter = { title: { $regex: search } };
          sort = { title: 1 };
        } else if (criteria == "location") {
          filter = { location: { $regex: search } };
          sort = { location: 1 };
        } else if (criteria == "sizeInSqFt") {
          filter = { sizeInSqFt: { $lte: parseInt(search) } };
          sort = { sizeInSqFt: 1 };
        } else if (criteria == "unitType") {
          filter = { unitType: search };
          sort = { unitType: 1 };
        } else if (criteria == "rentPerMonth") {
          filter = { rentPerMonth: { $lte: parseInt(search) } };
          sort = { rentPerMonth: 1 };
        } else if (criteria == "description") {
          filter = { description: { $regex: search } };
          sort = { description: 1 };
        } else if (criteria == "openingDate") {
          filter = { openingDate: { $eq: search } };
          sort = { openingDate: 1 };
        } else {
          filter = { leaseInMonths: { $eq: parseInt(search) } };
          sort = { leaseInMonths: 1 };
        }
        const queryResult = await listingsCollection
          .find(filter)
          .sort(sort)
          .toArray();
        return queryResult;
      } else {
        try {
          const queryResult = await listingsCollection
            .aggregate([
              {
                $sort: {
                  listingID: -1,
                },
              },
              {
                $addFields: {
                  avgRating: { $avg: "$rating.rating" },
                },
              },
            ])
            .toArray();
          return queryResult;
        } catch (err) {
          console.log("search unsuccessful", err);
        }
      }
    } finally {
      mongoClient.close();
    }
  };

  // // read selected Listing info
  studentHousingDB.getListingByID = async listingID => {
    let client;
    try {
      client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      await client.connect();
      const db = client.db(DB_NAME);
      const listingsCollection = db.collection("listings");
      console.log("attempting to get listings");
      const queryResult = await listingsCollection.findOne({
        listingID: parseInt(listingID),
      });
      console.log("queryResult", queryResult);
      return queryResult;
    } catch (err) {
      console.log("could not find", err);
    } finally {
      // we have to close the database connection otherwise we will overload the mongodb service.
      await client.close();
    }
  };

  // // read selected Listing info
  studentHousingDB.getListingsByAuthorID = async authorID => {
    let client;
    try {
      client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      await client.connect();
      const db = client.db(DB_NAME);
      const listingsCollection = db.collection("listings");
      const queryResult = await listingsCollection
        .aggregate([
          {
            $match: {
              authorID: authorID,
            },
          },
          {
            $addFields: {
              avgRating: { $avg: "$rating.rating" },
            },
          },
        ])
        .toArray();
      return queryResult;
    } finally {
      // we have to close the database connection otherwise we will overload the mongodb service.
      await client.close();
    }
  };

  studentHousingDB.createRating = async newRating => {
    let client;
    try {
      client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      await client.connect();
      const db = client.db(DB_NAME);
      const contactsCollection = db.collection("listings");
      const updateResult = await contactsCollection.updateOne(
        {
          listingID: newRating.listingID,
        },
        {
          $push: {
            rating: {
              raterID: newRating.user,
              rating: newRating.rating,
            },
          },
        }
      );
      return updateResult;
    } finally {
      await client.close();
    }
  };

  // // update Listing info
  studentHousingDB.updateRating = async ratingToUpdate => {
    let client;
    try {
      client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      await client.connect();

      const db = client.db(DB_NAME);
      const listingsCollection = db.collection("listings");
      const updateResult = await listingsCollection.updateOne(
        {
          listingID: ratingToUpdate.listingID,
        },
        {
          $set: {
            rating: [
              {
                raterID: ratingToUpdate.raterID,
                rating: ratingToUpdate.rating,
              },
            ],
          },
        }
      );

      return updateResult;
    } finally {
      await client.close();
    }
  };

  // // update Listing info
  studentHousingDB.updateListing = async listingToUpdate => {
    let client;
    const redisClient = createClient();
    try {
      client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      await client.connect();
      await redisClient.connect();
      const db = client.db(DB_NAME);
      const listingsCollection = db.collection("listings");

      if (listingToUpdate.available == "true") {
        listingToUpdate.available = true;
      } else {
        listingToUpdate.available = false;
      }
      const updateResult = await listingsCollection.updateOne(
        {
          listingID: listingToUpdate.listingID,
        },
        {
          $set: {
            title: listingToUpdate.title,
            location: listingToUpdate.location,
            sizeInSqFt: parseInt(listingToUpdate.sizeInSqFt),
            unitType: listingToUpdate.unitType,
            rentPerMonth: parseInt(listingToUpdate.rentPerMonth),
            description: listingToUpdate.description,
            openingDate: listingToUpdate.openingDate,
            leaseInMonths: parseInt(listingToUpdate.leaseInMonths),
            available: listingToUpdate.available,
          },
        }
      );

      let sortedListing = await redisClient.zRange("rankedListings", 0, -1);
      if (sortedListing.length > 0) {
        //update listing object in redis
        let score = await redisClient.hGet(
          `listing:${listingToUpdate.listingID}:${listingToUpdate.authorID}`,
          "score"
        );
        let avgRating = await redisClient.hGet(
          `listing:${listingToUpdate.listingID}:${listingToUpdate.authorID}`,
          "avgRating"
        );

        await redisClient.hSet(
          `listing:${listingToUpdate.listingID}:${listingToUpdate.authorID}`,
          {
            listingID: `${listingToUpdate.listingID}`,
            title: listingToUpdate.title,
            location: listingToUpdate.location,
            unitType: listingToUpdate.unitType,
            sizeInSqFt: listingToUpdate.sizeInSqFt,
            rentPerMonth: listingToUpdate.sizeInSqFt,
            description: listingToUpdate.description,
            openingDate: listingToUpdate.openingDate,
            leaseInMonths: `${listingToUpdate.leaseInMonths}`,
            available: listingToUpdate.available,
            authorID: `${listingToUpdate.authorID}`,
            avgRating: avgRating,
            score: score,
          }
        );
      }

      return updateResult;
    } finally {
      await client.close();
    }
  };

  // delete Listing
  studentHousingDB.deleteListing = async (listingToDelete, authorID) => {
    let client;
    const redisClient = createClient();

    try {
      client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      await client.connect();
      await redisClient.connect();
      const db = client.db(DB_NAME);
      const listingsCollection = db.collection("listings");
      const deleteResult = await listingsCollection.deleteOne({
        listingID: listingToDelete,
      });
      await redisClient.zRem(
        "rankedListings",
        `listing:${listingToDelete}:${authorID}`
      );
      await redisClient.del(`listing:${listingToDelete}:${authorID}`);
      return deleteResult;
    } finally {
      client.close();
    }
  };

  // /*
  //  ***************MESSAGE CRUD OPERATIONS*********************
  //  */

  studentHousingDB.createMessage = async newMessage => {
    let client;
    try {
      client = new MongoClient(uri, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
      });

      await client.connect();
      const db = client.db(DB_NAME);
      const messagesCollection = db.collection("messages");
      let max = await messagesCollection
        .aggregate([
          {
            $group: {
              _id: "$_id",
              count: {
                $max: "$messageID",
              },
            },
          },
        ])
        .sort({ count: -1 })
        .limit(1)
        .toArray();
      // console.log(max);
      // console.log(parseInt(max[0].count, 10));

      let messageID = 1 + parseInt(max[0].count, 10);
      // console.log(listingID);

      const newMessageToAdd = {
        messageID: messageID.toString(),
        sender: newMessage.sender,
        receiver: newMessage.receiver,
        time: newMessage.time,
        listingID: newMessage.listingID,
        message: newMessage.message,
      };
      const insertResult = await messagesCollection.insertOne(newMessageToAdd);
      return insertResult.insertedCount;
    } finally {
      client.close();
    }
  };

  studentHousingDB.getMessages = async (sender, receiver, listingID) => {
    let client;
    try {
      client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      await client.connect();
      const db = client.db(DB_NAME);
      const messagesCollection = db.collection("messages");

      console.log(listingID);
      const queryResult = await messagesCollection
        .find({
          listingID: listingID,
          $or: [
            { sender: sender, receiver: receiver },
            { sender: receiver, receiver: sender },
          ],
        })
        .toArray();
      return queryResult;
    } finally {
      // we have to close the database connection otherwise we will overload the mongodb service.
      await client.close();
    }
  };

  studentHousingDB.getAllMessages = async username => {
    let client;
    try {
      client = new MongoClient(uri, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
      });

      await client.connect();
      const db = client.db(DB_NAME);
      const messageCollection = db.collection("messages");
      // we will be using the user's email as their username
      const queryResult = await messageCollection
        .find({
          $or: [{ sender: username }, { receiver: username }],
        })
        .toArray();
      // console.log(queryResult);
      return queryResult;
    } finally {
      client.close();
    }
  };

  // delete Message
  studentHousingDB.deleteMessage = async messageToDelete => {
    let client;
    try {
      client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      await client.connect();
      const db = client.db(DB_NAME);
      const messagesCollection = db.collection("messages");
      const deleteResult = await messagesCollection.deleteOne({
        messageID: messageToDelete.messageID,
      });
      // console.log("to be deleted: ", messageToDelete);
      // console.log("deleted", deleteResult);
      return deleteResult;
    } finally {
      client.close();
    }
  };

  /*
   ***************Redis Listing CRUD OPERATIONS*********************
   */
  studentHousingDB.setScore = async () => {
    const redisClient = createClient();
    try {
      await redisClient.connect();
      await redisClient.set("score", "0");
    } catch (err) {
      console.log(err, "score");
    } finally {
      await redisClient.quit();
    }
  };

  studentHousingDB.getRankedListingsByAuthorID = async authorID => {
    const redisClient = createClient();

    try {
      await redisClient.connect();
      let sortedListing = await redisClient.zRange("rankedListings", 0, -1);
      let result = [];

      console.log("length " + sortedListing.length);

      // let listing = await redisClient.hGetAll(`${sortedListing[0]}`);
      // console.log(listing);
      for (let i = 0; i < sortedListing.length; i++) {
        let Id = await redisClient.hGet(`${sortedListing[i]}`, "authorID");

        if (Id == authorID) {
          let listing = await redisClient.hGetAll(`${sortedListing[i]}`);
          //console.log(listing);
          result.push(listing);
        }
      }
      return result;
    } catch (err) {
      console.log(err, "sortedListing");
    } finally {
      await redisClient.quit();
    }
  };

  studentHousingDB.rankListing = async listing => {
    const redisClient = createClient();

    try {
      await redisClient.connect();
      await redisClient.incr("score");
      let score = await redisClient.get("score");
      console.log("score " + score);
      console.log(`listing:${listing.listingID}:${listing.authorID}`);
      await redisClient.hSet(
        `listing:${listing.listingID}:${listing.authorID}`,
        {
          listingID: `${listing.listingID}`,
          title: listing.title,
          location: listing.location,
          unitType: listing.unitType,
          sizeInSqFt: listing.sizeInSqFt,
          rentPerMonth: listing.sizeInSqFt,
          description: listing.description,
          openingDate: listing.openingDate,
          leaseInMonths: `${listing.leaseInMonths}`,
          available: listing.available,
          authorID: `${listing.authorID}`,
          avgRating: `${listing.avgRating}`,
          score: score,
        }
      );

      let newListing = await redisClient.hGetAll(
        `listing:${listing.listingID}:${listing.authorID}`
      );
      console.log(newListing);
      await redisClient.zAdd("rankedListings", {
        score: score,
        value: `listing:${listing.listingID}:${listing.authorID}`,
      });
    } catch (err) {
      console.log(err, "listing objects");
    } finally {
      await redisClient.quit();
    }
  };

  studentHousingDB.getSortedListings = async () => {
    const redisClient = createClient();

    try {
      await redisClient.connect();
      let sortedListing = await redisClient.zRange("rankedListings", 0, -1);
      let result = [];

      console.log("length " + sortedListing.length);

      // let listing = await redisClient.hGetAll(`${sortedListing[0]}`);
      // console.log(listing);
      for (let i = 0; i < sortedListing.length; i++) {
        let listing = await redisClient.hGetAll(`${sortedListing[i]}`);
        //console.log(listing);
        result.push(listing);
      }
      return result;
    } catch (err) {
      console.log(err, "sortedListing");
    } finally {
      await redisClient.quit();
    }
  };

  return studentHousingDB;
};

module.exports = StudentHousingDBController();
