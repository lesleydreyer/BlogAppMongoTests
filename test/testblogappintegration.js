'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

// this makes the expect syntax available throughout
// this module
const expect = chai.expect;

const {BlogPost} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

// used to put randomish documents in db
// so we have data to work with and assert about.
// we use the Faker library to automatically
// generate placeholder values for author, title, content
// and then we insert that data into mongo
/*function seedBlogData() {
  console.info('seeding blog data');
  const seedData = [];

  for (let i=1; i<=10; i++) {
    seedData.push(generateBlogData());
  }
  // this will return a promise
  return BlogPost.insertMany(seedData);
}*/

function seedBlogPostData() {
    console.info('seeding blog post data');
    const seedData = [];
    for (let i = 1; i <= 10; i++) {
      seedData.push({
        author: {
          firstName: faker.name.firstName(),
          lastName: faker.name.lastName()
        },
        title: faker.lorem.sentence(),
        content: faker.lorem.text()
      });
    }
    // this will return a promise
    return BlogPost.insertMany(seedData);
  }

// used to generate data to put in db
function generateTitle() {
  const title = [
    'Title1', 'Title2', 'Title3', 'Title4', 'Title5'];
  return title[Math.floor(Math.random() * title.length)];
}

// used to generate data to put in db
function generateAuthor() {
    const author = [
      'Andy', 'Mike', 'Estevan', 'Whitney', 'Emauni'];
    return author[Math.floor(Math.random() * author.length)];
  }

// used to generate data to put in db
function generateContent() {
  const content = ['lorem ipsum', 'iarml sliewa', 'raemc arim sre'];
  return content[Math.floor(Math.random() * content.length)];
}

// used to generate data to put in db
function generateGrade() {
  const grades = ['A', 'B', 'C', 'D', 'F'];
  const grade = grades[Math.floor(Math.random() * grades.length)];
  return {
    date: faker.date.past(),
    grade: grade
  };
}

// generate an object represnting a restaurant.
// can be used to generate seed data for db
// or request.body data
function generateBlogData() {
  return {
    //name: faker.company.companyName(),
    title: generateTitle(),
    author: generateAuthor(),
    content: generateContent()
  };
}


// this function deletes the entire database.
// we'll call it in an `afterEach` block below
// to ensure data from one test does not stick
// around for next one
function tearDownDb() {
  console.warn('Deleting database');
  return mongoose.connection.dropDatabase();
}

describe('Blog API resource', function() {

  // we need each of these hook functions to return a promise
  // otherwise we'd need to call a `done` callback. `runServer`,
  // `seedRestaurantData` and `tearDownDb` each return a promise,
  // so we return the value returned by these function calls.
  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return seedBlogPostData();
  });

  afterEach(function() {
    return tearDownDb();
  });

  after(function() {
    return closeServer();
  });

  // note the use of nested `describe` blocks.
  // this allows us to make clearer, more discrete tests that focus
  // on proving something small
  describe('GET endpoint', function() {

    it('should return all existing blog posts', function() {
      // strategy:
      //    1. get back all restaurants returned by by GET request to `/restaurants`
      //    2. prove res has right status, data type
      //    3. prove the number of restaurants we got back is equal to number
      //       in db.
      //
      // need to have access to mutate and access `res` across
      // `.then()` calls below, so declare it here so can modify in place
      let res;
      return chai.request(app)
        .get('/posts')//or blog-posts?
        .then(function(_res) {
          // so subsequent .then blocks can access response object
          res = _res;
          expect(res).to.have.status(200);
          // otherwise our db seeding didn't work
          expect(res.body.blogposts).to.have.lengthOf.at.least(1);
          return BlogPost.count();
        })
        .then(function(count) {
          expect(res.body.blogposts).to.have.lengthOf(count);
        });
    });


    it('should return posts with right fields', function() {
      // Strategy: Get back all restaurants, and ensure they have expected keys

      let resPosts;
      return chai.request(app)
        .get('/posts') //blog-posts?
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body.blogposts).to.be.a('array');
          expect(res.body.blogposts).to.have.lengthOf.at.least(1);

          res.body.blogposts.forEach(function(restaurant) {
            expect(blogpost).to.be.a('object');
            expect(blogpost).to.include.keys(
              'id', 'title', 'author', 'content');//created?
          });
          resPost = res.body.blogposts[0];
          return BlogPost.findById(resPost.id);
        })
        .then(function(blogpost) {//post?

          expect(resPost.id).to.equal(blogpo.id);
          expect(resPost.title).to.equal(blogpost.title);
          expect(resPost.author).to.equal(blogpost.author);
          expect(resPost.content).to.equal(blogpost.content);
        });
    });
  });

  describe('POST endpoint', function() {
    // strategy: make a POST request with data,
    // then prove that the restaurant we get back has
    // right keys, and that `id` is there (which means
    // the data was inserted into db)
    it('should add a new blog post', function() {

      const newPost = generateBlogData();


      return chai.request(app)
        .post('/posts')
        .send(newPost)
        .then(function(res) {
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys(
            'id', 'title', 'author', 'content');//created?
          expect(res.body.title).to.equal(newPost.title);
          // cause Mongo should have created id on insertion
          expect(res.body.id).to.not.be.null;
          expect(res.body.author).to.equal(newPost.author);
          expect(res.body.content).to.equal(newPost.content);
          return BlogPost.findById(res.body.id);
        })
        .then(function(blogpost) {
          expect(blogpost.title).to.equal(newPost.title);
          expect(blogpost.author.firstName).to.equal(newPost.author.firstName);
          expect(blogpost.author.lastName).to.equal(newPost.author.lastName);
          expect(blogpost.content).to.equal(newPost.content);
        });
    });
  });

  describe('PUT endpoint', function() {

    // strategy:
    //  1. Get an existing restaurant from db
    //  2. Make a PUT request to update that restaurant
    //  3. Prove restaurant returned by request contains data we sent
    //  4. Prove restaurant in db is correctly updated
    it('should update fields you send over', function() {
      const updateData = {
        title: 'mr futa fu',
        author: {firstName:'futuristic', lastName: 'fusion'}, 
        content: 'fofofofofofo'
      };

      return BlogPost
        .findOne()
        .then(function(blogpost) {
          updateData.id = blogpost.id;

          // make request then inspect it to make sure it reflects
          // data we sent
          return chai.request(app)
            .put(`/posts/${blogpost.id}`)
            .send(updateData);
        })
        .then(function(res) {
          expect(res).to.have.status(204);

          return BlogPost.findById(updateData.id);
        })
        .then(function(blogpost) {
          expect(blogpost.title).to.equal(updateData.title);
          expect(blogpost.author.firstName).to.equal(updateData.author.firstName);
          expect(blogpost.author.lastName).to.equal(updateData.author.lastName);
          expect(blogpost.content).to.equal(updateData.content);
        });
    });
  });

  describe('DELETE endpoint', function() {
    // strategy:
    //  1. get a restaurant
    //  2. make a DELETE request for that restaurant's id
    //  3. assert that response has right status code
    //  4. prove that restaurant with the id doesn't exist in db anymore
    it('delete a restaurant by id', function() {

      let blogpost;

      return BlogPost
        .findOne()
        .then(function(_blogpost) {
          blogpost = _blogpost;
          return chai.request(app).delete(`/posts/${blogpost.id}`);
        })
        .then(function(res) {
          expect(res).to.have.status(204);
          return BlogPost.findById(blogpost.id);
        })
        .then(function(_blogpost) {
          expect(_blogpost).to.be.null;
        });
    });
  });
});