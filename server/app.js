require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const models = require('../app/models/db.js');

const app = express();

app.use(bodyParser.urlencoded({
  extended: true,
}));
app.use(bodyParser.json());
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true,
}));

// serve static files
app.use(express.static(`${__dirname}/../client/dist`));


//* ****************************
// HOA
//* ****************************

// when a user attemps to login, this endpoint will be hit (see handleClick function in Login.jsx):
app.get('/checkForUser/:firebaseId', (req, res) => {
  // query the database for the user with the attached firebaseId
  const sqlQuery = `SELECT * FROM hoa WHERE firebaseId='${req.params.firebaseId}'`;
  models.sequelize.query(
    sqlQuery,
    {
      model: models.Hoa,
    },
  ).then((hoaInfoFromDb) => {
    // hoaInfoFromDb is an array of the user's info from the database
    console.log('yyyyyyyyyyy', hoaInfoFromDb);
    res.send({
      // send back an object with regisetered equal to true or false:
      /* registered will be false if an empty array is returned (this means this is the first time
         the user signed-in so the firebaseId wasn't saved in the db yet) */
      registered: !!hoaInfoFromDb.length,
    });
  })
    .catch((err) => {
      console.error(err, 'ERROR: CANNOT SELECT ACCOUNTS.');
    });
});

// this endpoint is hit when a new user sumbits the HoaInfo form (see handleSubmit in InputInfo.jsx)
app.post('/saveHoaInfo', (req, res) => {
  const {
    name, address, city, state, zipcode, phone, email, firebaseId,
  } = req.body;

  console.log('req bodyuyyy', req.body);

  // when the form is submitted, query the database for the user with the logged-in firebaseId
  const sqlQuery1 = `SELECT * FROM hoa WHERE firebaseId='${firebaseId}'`;
  models.sequelize.query(sqlQuery1, {
    model: models.Hoa,
  })
    .then(currentHoaInfo => {
      console.log('uuyyyy', currentHoaInfo.length);
      // return the user's info retrieved fro mthe database
      if (currentHoaInfo.length) {
        return res.send(currentHoaInfo[0]);
      }
      /* else, if currentHoaInfo comes back as an empty array (meaning they're a new user),
         save their data in the database */
      const sqlQuery = `INSERT INTO hoa (name, address, city, state, zipcode, phone, email, firebaseId) 
        VALUES ('${name}', '${address}', '${city}', '${state}', '${zipcode}', '${phone}', '${email}', '${firebaseId}')`;
      return models.sequelize.query(sqlQuery, {
        model: models.Hoa,
      })
        .then(() => res.send({ infoWasSaved: true }))
        .catch((err) => {
          console.error('ERROR: Info was not saved.', err);
          res.status(500).send({ infoWasSaved: false });
        });

    });
});


//* ****************************
// REVENUES
//* ****************************

// Add a Deposit
app.post('/api/addDeposit', (req, res) => {


});

// View All Deposits/Revenue
app.get('/api/viewRevenues', (req, res) => {


});


//* ****************************
// EXPENSES
//* ****************************

// Add an Expense
app.post('/api/addExpense', (req, res) => {


});

// View Expenses
app.get('/api/viewExpenses', (req, res) => {


});


//* ****************************
// HOMEOWNERS
//* ****************************

// Add a Homeowner
app.post('/api/addHomeOwner', (req, res) => {

});

// Delete a Homeowner

app.post('/api/removeHomeowner', (req, res) => {


});

// Update a Homeowner

app.put('/api/updateHomeowner', (req, res) => {


});

// View HomeOwners
app.get('/api/viewHomeowners', (req, res) => {


});

//* ****************************
// STAFF
//* ****************************

// Add a Staff Person
app.post('/api/addStaff', (req, res) => {
  models.Staff.create({
    hoaId: req.body.hoaId,
    department: req.body.department,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    fullName: `${req.body.lastName}, ${req.body.firstName}`,
    phone: req.body.phone,
    email: req.body.email,
  })
    .then(() => {
      res.send(201);
    })
    .catch((error) => {
      console.error(error);
    });
});

// Get ALL Staff
app.get('/api/getStaff', (req, res) => {
  models.Staff.findAll()
    .then((staff) => {
      res.send(staff);
    })
    .catch((error) => {
      console.error(error);
    });
});

//* ****************************
// WORK TICKETS
//* ****************************

// Add a Work Ticket
app.post('/api/addTicket', (req, res) => {
  models.WorkTickets.create({
    hoaId: req.body.hoaId,
    title: req.body.title,
    description: req.body.description,
    assignedTo: req.body.assignedTo,
  })
    .then(() => {
      res.send(201);
    })
    .catch((error) => {
      console.error(error);
    });
});

// Get Open Tickets
app.get('api/getOpenTickets', (req, res) => {


});

// View All Tickets
app.get('api/viewAllTickets', (req, res) => {


});

// Close a Work Ticket
app.post('api/closeWorkTicket', (req, res) => {


});

//* ****************************
// BOARD MEMBERS
//* ****************************

// Add a Board Member
app.post('/api/addBoardMember', (req, res) => {


});

// Delete a Board Member
app.post('/api/deleteBoardMember', (req, res) => {


});

// force requests to client files
app.get('*', (req, res) => {
  res.sendFile(path.resolve(`${__dirname}/../client/dist/index.html`));
});


const port = process.env.port || 3000;
app.listen(port, () => {
  console.log(`you servin on port ${port}`);
});
