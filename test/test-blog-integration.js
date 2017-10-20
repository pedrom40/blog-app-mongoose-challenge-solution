// necessary libraries and settings
const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const {BlogPost} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);


// seed db with test data
function seedData () {
  console.log('seeding test data');

  // var to hold test data
  const seedData = [];

  // insert 10 records
  for (let i=0; i < 10; i++) {
    seedData.push(generateData());
  }

  // return the test data
  return BlogPost.insertMany(seedData);

}

// generate test data
function generateData () {
  return {
    author: {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName()
    },
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraphs(),
    created: faker.date.recent()
  }
}

// delete test data
function tearDownDb () {
  console.warn('deleting test db');
  return mongoose.connection.dropDatabase();
}


describe('Blog Posts API resource', () => {

  before( () => {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach( () => {
    return seedData();
  });

  afterEach( () => {
    return tearDownDb();
  });

  after( () => {
    return closeServer();
  });


  // test GET endpoint
  describe('GET endpoint', () => {

    it('should return all blog posts', () => {

      // make response variable available throughout nests
      let res;

      return chai.request(app)

        // get all the existing records
        .get('/posts')

        // now check them out
        .then( _res => {

          // pass to parent res var; success status and count check
          res = _res;
          expect(res).to.have.status(200);
          expect(res.body).to.have.length.of.at.least(1);

          // send number of records to next promise
          return BlogPost.count();

        })

        // now make sure we have the correct number
        .then( count => {
          expect(res.body).to.have.lengthOf(count);
        });

    });

  });

});
