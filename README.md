# StudentHousingFinder

![Logo](screenshots/SH.png)

## Original Project Proposal:

An application that lets users explore a list of student housing.

It will support:

-  CRUD dorm/apartment listings
-  Sort and filter by location/building, cost, or by user input
-  Owner/renter (user) sign-up/login
-  CRUD user information
-  Users can rate dorm/apartment listings

Functionalities for in-memory key-value storage will support:

-  CRUD dorm/apartment listings
-  Ranking list for listings based on highest rating ranking
-  Filtering system for rendering available and unavailable listings separately to the browser when called for both owners and students

In-memory key-value storage data structures used:

Ranking Listings

-  Strings, Hash Sets, and Sorted Sets will be used for ranking listings with highest ratings.

-  Will use Hash Sets to store listings key-value pairs. We will provide an attribute score to keep track of the rank of each listing object and reference it’s key in a sorted set.

-  To get the score of a listing a String count will be set and incremented by 1 when called.

-  By doing so we can call each listing object by its key in a sorted set which is ordered by the score attribute from each listing object.

## Installation and Execution

1. Clone the repository
2. In terminal: `npm install`

#   Imports:
4. To import listings:
   `mongoimport -h localhost:27017 -d project2 -c listings --file ./db/Listing.json --jsonArray`
5. To import messages:
   `mongoimport -h localhost:27017 -d project2 -c messages --file ./db/Message.json --jsonArray`
6. To import users:
   `mongoimport -h localhost:27017 -d project2 -c users --file ./db/Student.json --jsonArray`
   `mongoimport -h localhost:27017 -d project2 -c users --file ./db/Owner.json --jsonArray`
7. To import schools:
   `mongoimport -h localhost:27017 -d project2 -c schools --file ./db/Schools.json --jsonArray`

8. In terminal: `npm start`
9. In browser, go to http://localhost:3000

> _Register and Sign In Note:
> Because owners and students have different permissions for listings, page will look different depending on whether you sign up as an owner or a student._

## Authors:

Bernard Ekezie (https://github.com/bekezie) & Domenic (Ely) Lam (https://github.com/domenic-lam)

@Domenic (Ely) Lam implemented:

-  Registering the owners and updating their listings as they post new housing listings.
-  CRUD operations on the listings.
-  Making sure owners have permissions to CRUD listings, but students can only view them.
-  CRUD operations on the messages between users and ensuring each message has one distinct sender and one distinct receiver.
-  Making sure users can only delete messages they sent.
-  Create warning if users try to register with non-unique username.
-  Search listings by certain criteria (finds all that matches at least one of the search criteria but not all criteria).
-  Making instructions on setup and importing collections to localhost.
-  Create toggle view for students to view available listings or all listings
-  Create toggle view for owners to view unavailable listings or all listings so owners can delete them

@Bernard Ekezie implemented:

-  Registering the students and updating their ratings per listing.
-  CRUD operations on the students and schools.
-  CRUD operations on the ratings.
-  CRUD operations on the user and ensuring users have a unique username.
-  Created Document Base Logical modal.
-  Rank listings based on highest rating in redis.
-  CRUD operations on ranked listing by rating ensuring that any changes made by user will be handle throughout mongodb and redis.
-  Created toogle for owners and students to rank and unrank listings by highest rating.

# Project 2 (Part 2: Design):

Link to Business Requirements and Redis Structure Definitions: https://docs.google.com/document/d/1U-KUPu-nW8fwHIpMbF03xYfmWVMdTYuDPdS_fJP_PdY/edit
\*Found in ./design/CS5200_Project3_BusReqs&RedisStructDefs.pdf

UML Diagram
![Logo](design/Project2-UML.png)
ER Diagram
![Logo](design/Project2-DBMS-ERD.png)
