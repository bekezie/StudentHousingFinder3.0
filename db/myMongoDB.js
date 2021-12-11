const { MongoClient, ObjectId } = require("mongodb");

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
  studentHousingDB.createNewOwner = async (newUser) => {
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

  studentHousingDB.createNewStudent = async (newUser) => {
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

  studentHousingDB.getOwnerByAuthorID = async (authorID) => {
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
  studentHousingDB.getUserByUsername = async (query) => {
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
  studentHousingDB.getUserCred = async (user) => {
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

  //  ***************Listing CRUD OPERATIONS*********************
  //  */
  // // create new Listing
  studentHousingDB.createListing = async (newListing, authorID) => {
    let client;
    try {
      client = new MongoClient(uri, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
      });

      await client.connect();
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

      const newListingToAdd = {
        listingID: listingID.toString(),
        title: newListing.title,
        location: newListing.location,
        unitType: newListing.unitType,
        sizeInSqFt: newListing.sizeInSqFt,
        rentPerMonth: newListing.rentPerMonth,
        description: newListing.description,
        openingDate: newListing.openingDate,
        leaseInMonths: newListing.leaseInMonths,
        available: newListing.available,
        authorID: authorID,
      };
      const insertResult = await listingsCollection.insertOne(newListingToAdd);
      return insertResult.insertedCount;
    } finally {
      client.close();
    }
  };

  // get all Listings , may implement pagination later
  studentHousingDB.getListings = async () => {
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
      // we will be using the user's email as their username

      const queryResult = await listingsCollection
        .aggregate([
          {
            $match: {
              listingID: listingID,
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

      return queryResult[0].rating;
    } finally {
      // we have to close the database connection otherwise we will overload the mongodb service.
      await client.close();
    }
  };

  // search Listings , may implement pagination later
  studentHousingDB.searchListings = async (searchCriteria) => {
    let client;
    try {
      client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      await client.connect();
      const db = client.db(DB_NAME);
      const listingsCollection = db.collection("listings");
      if (searchCriteria != undefined) {
        try {
          let filter = {
            $or: [
              {
                location: /.*searchCriteria.location.*/,
              },
              {
                sizeInSqFt: /.*searchCriteria.sizeInSqFt.*/,
              },
              {
                unitType: searchCriteria.unitType,
              },
              {
                rentPerMonth: /.*searchCriteria.rentPerMonth.*/,
              },
              {
                description: /.*searchCriteria.description.*/,
              },
              {
                openingDate: searchCriteria.openingDate,
              },
              {
                leaseInMonths: searchCriteria.leaseInMonths,
              },
              {
                available: searchCriteria.available,
              },
            ],
          };
          let sort = {
            listingID: -1,
          };
          const queryResult = await listingsCollection
            .find(filter, { sort: sort })
            .toArray();
          return queryResult;
        } catch (err) {
          console.log("search unsuccessful", err);
        }
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
      client.close();
    }
  };

  // // read selected Listing info
  studentHousingDB.getListingByID = async (listingID) => {
    let client;
    try {
      client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      await client.connect();
      const db = client.db(DB_NAME);
      const listingsCollection = db.collection("listings");
      // console.log("attempting to get listings");
      // we will be using the user's email as their username
      const queryResult = await listingsCollection.findOne({
        listingID: listingID,
      });
      return queryResult;
    } finally {
      // we have to close the database connection otherwise we will overload the mongodb service.
      await client.close();
    }
  };

  // // read selected Listing info
  studentHousingDB.getListingsByAuthorID = async (authorID) => {
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

  studentHousingDB.createRating = async (newRating) => {
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
  studentHousingDB.updateRating = async (ratingToUpdate) => {
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
  studentHousingDB.updateListing = async (listingToUpdate) => {
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
          listingID: listingToUpdate.listingID,
        },
        {
          $set: {
            title: listingToUpdate.title,
            location: listingToUpdate.location,
            sizeInSqFt: listingToUpdate.sizeInSqFt,
            unitType: listingToUpdate.unitType,
            rentPerMonth: listingToUpdate.rentPerMonth,
            description: listingToUpdate.description,
            openingDate: listingToUpdate.openingDate,
            leaseInMonths: listingToUpdate.leaseInMonths,
            available: listingToUpdate.available,
          },
        }
      );
      return updateResult;
    } finally {
      await client.close();
    }
  };

  // // delete Listing
  studentHousingDB.deleteListing = async (listingToDelete) => {
    let client;
    try {
      client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      await client.connect();
      const db = client.db(DB_NAME);
      const listingsCollection = db.collection("listings");
      const deleteResult = await listingsCollection.deleteOne({
        listingID: listingToDelete,
      });
      return deleteResult;
    } finally {
      client.close();
    }
  };

  // /*
  //  ***************MESSAGE CRUD OPERATIONS*********************
  //  */

  studentHousingDB.createMessage = async (newMessage) => {
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

  studentHousingDB.getAllMessages = async (username) => {
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
  studentHousingDB.deleteMessage = async (messageToDelete) => {
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

  return studentHousingDB;
};

module.exports = StudentHousingDBController();
