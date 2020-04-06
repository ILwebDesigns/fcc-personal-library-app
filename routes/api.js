/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

var expect = require("chai").expect;
var MongoClient = require("mongodb").MongoClient;
var ObjectId = require("mongodb").ObjectId;
var assert = require("assert");

const MONGODB_CONNECTION_STRING =process.env.DB;  
const client = new MongoClient(MONGODB_CONNECTION_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

(async function() {
  try {
    await client.connect();
    console.log("Base de Datos Conectada!");
    const db = client.db("library");

    await db.createCollection("books", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["title"],
          properties: {
            title: {
              bsonType: "string",
              minLength: 1,
              description: "must be a string and is required"
            },
            comments: {
              bsonType: "array",
              description: "must be a string if the field exist"
            },
            commentcount: {
              bsonType: "int",
              description: "must be a intiger if the field exist"
            }
          }
        }
      }
    });
  } catch (err) {
    console.log(`ERROR AL CREAR LISTA DE LIBROS:<p>${err.stack}`);
  }
})();

module.exports = function(app) {
  app
    .route("/api/books")
    .get(function(req, res) {
      (async function() {
        try {
          let docs = await client
            .db("library")
            .collection("books")
            .find({}, { projection: { _id: 1, title: 1, commentcount: 1 } })
            .toArray();
          res.json(docs);
        } catch (err) {
          res.send(`ERROR AL SOLICITAR LISTA DE LIBROS`);
        }
      })();
    })

    .post(function(req, res) {
      const title = req.body.title;      
      (async () => {
        try {
          const newBook = await client
            .db("library")
            .collection("books")
            .insertOne(
              {
                title: title,
                comments: [],
                commentcount: 0
              },
              {
                projection: {
                  title: 1,
                  _id: 1
                }
              }
            );
          assert.equal(newBook.insertedCount, 1);
          res.json(newBook.ops[0]);
        } catch (err) {
          res.json("error adding new book");
        }
      })();
    })

    .delete(function(req, res) {      
      (async () => {
        try {
          const delAll = await client.db("library").collection("books").deleteMany({});
          res.json(`complete delete successful ${delAll.deletedCount}`);
        } catch (err) {
          res.json(`Delete error`);
        }
      })();
    });

  app
    .route("/api/books/:id")
    .get(function(req, res) {
      var bookid = req.params.id;
      (async function() {
        try {
          let book = await client
            .db("library")
            .collection("books")
            .find(
              { _id: new ObjectId(bookid) },
              { projection: { _id: 1, title: 1, comments: 1 } }
            )
            .toArray();
          res.json(book[0]);
        } catch (err) {
          res.json(
            `Error getting book`
          );
        }
      })();
      //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
    })

    .post(function(req, res) {      
      var bookid = req.params.id;
      var comment = req.body.comment;      
      (async function() {
        try {
          let comm = await client
            .db("library")
            .collection("books")
            .findOneAndUpdate(
              { _id: new ObjectId(bookid) },
              { $push: { comments: comment }, $inc: { commentcount: 1 }},
              {returnOriginal: false, projection: { _id: 1, title: 1, comments: 1 } }              
            );
          res.json(comm.value);
        } catch (err) {
          res.json(`Update error`)
        }
      })();
    })

    .delete(function(req, res) {
      var bookid = req.params.id;
       (async function() {
        try {
          let comm = await client
            .db("library")
            .collection("books")
            .findOneAndDelete(
              { _id: new ObjectId(bookid) }              
            );
          res.json(`Delete successful`);
        } catch (err) {
          res.json(`Delete error`)
        }
      })();
    });
};
