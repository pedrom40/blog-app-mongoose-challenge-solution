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

  // test POST endpoint
  describe('POST endpoint', () => {

    it('should add a new post', () => {

      // init new record
      const newRecord = generateData();

      return chai.request(app)
        .post('/posts')
        .send(newRecord)
        .then( res => {

          // ensure response has all necessary info
          expect(res).to.have.status(201);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.deep.keys({ id: 1, author: { firstName: 1, lastName: 1 }, title: 1, content: 1, created: 1 });

          // check that the info matches what was passed in
          expect(res.body.author).to.equal(`${newRecord.author.firstName} ${newRecord.author.lastName}`);
          expect(res.body.title).to.equal(newRecord.title);
          expect(res.body.content).to.equal(newRecord.content);

          // pass new record to next part in the chain (promise)
          return BlogPost.findById(res.body.id);

        })
        .then( post => {

          // check that the title in the post matches the title in the db
          expect(post.title).to.equal(newRecord.title);

        });

    });

  });

  // test PUT endpoint
  describe('PUT endpoint', () => {

    it('should update the fields you send over', () => {

      // data to update
      const updateData = {
        title: 'Updated Title',
        content: 'Updated content'
      }

      return BlogPost
        .findOne()
        .then( post => {

          // set the id property of the update data to the record we returned
          updateData.id = post.id;

          // make the update, then return the record to the next promise
          return chai.request(app)
            .put(`/posts/${post.id}`)
            .send(updateData);

        })
        .then( res => {

          // check status
          expect(res.status).to.equal(204);

          // get the record
          return BlogPost.findById(updateData.id);

        })
        .then( post => {

          // check that the title and content equal the updated values
          expect(post.title).to.equal(updateData.title);
          expect(post.content).to.equal(updateData.content);

        });

    });

  });

  // test DELETE endpoint
  describe('DELETE endpoint', () => {

    it('should delete a record by id', () => {

      // declare post var here so we can access it across the test
      let post;

      return BlogPost
        .findOne()
        .then ( _post => {

          // set the returned post as our test var, then send for deletion
          post = _post;
          return chai.request(app).delete(`/posts/${post.id}`);

        })
        .then( res => {

          // check for correct stats
          expect(res.status).to.equal(204);

          // attempt to retrieve the record
          return BlogPost.findById(post.id);

        })
        .then( _post => {

          // should not find record
          expect(_post).to.not.exist;

        });
    });

  });

});
