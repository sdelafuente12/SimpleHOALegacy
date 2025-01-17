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
    .then((currentHoaInfo) => {
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
        type: models.Sequelize.QueryTypes.INSERT,
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
  const {
    hoaId, accountId, amountPaid, description,
  } = req.body;
  models.Revenues.create({
    hoaId,
    accountId,
    date: models.sequelize.literal('CURRENT_TIMESTAMP'),
    amountPaid,
    description,
  })
    .then(() => {
      res.send(201);
    })
    .catch((error) => {
      console.error(error);
    });
});

// get All Revenues (For now, this is just Dues.
// However, this can be expanded to other revenue sources as well)
app.get('/api/getRevenues', (req, res) => {
  const { hoaId } = req.body;
  models.Revenues.findAll({
    where: {
      hoaId,
    },
  })
    .then((revenues) => {
      res.send(revenues);
    })
    .catch((error) => {
      console.error(error);
    });
});


//* ****************************
// EXPENSES
//* ****************************

// Add an Expense
app.post('/api/addExpense', (req, res) => {
  const {
    hoaId, payType, amountPaidOut, description,
  } = req.body;
  models.Expenses.create({
    hoaId,
    date: models.sequelize.literal('CURRENT_TIMESTAMP'),
    payType,
    amountPaidOut,
    description,
  })
    .then(() => {
      res.send(201);
    })
    .catch((error) => {
      console.error(error);
    });
});

// get ALL Expenses
app.get('/api/getExpenses', (req, res) => {
  const { hoaId } = req.body;
  models.Expenses.findAll({
    where: {
      hoaId,
    },
  })
    .then((allExpenses) => {
      res.send(allExpenses);
    })
    .catch((error) => {
      console.error(error);
    });
});

// get Expenses of a certain type
app.get('/api/getTypeExpenses', (req, res) => {
  const {
    hoaId, payType,
  } = req.body;
  models.Expenses.findAll({
    where: {
      hoaId,
      payType,
    },
  })
    .then((typeExpenses) => {
      res.send(typeExpenses);
    })
    .catch((error) => {
      console.log(error);
    });
});


//* ****************************
// HOMEOWNERS
//* ****************************

// Add a Homeowner
app.post('/api/addHomeOwner', (req, res) => {
  const {
    hoaId, firstName, lastName, address, city, state, zipcode, monthlyDues, email, phone,
  } = req.body;
  models.Homeowners.create({
    hoaId,
    firstName,
    lastName,
    fullName: `${req.body.lastName}, ${req.body.firstName}`,
    address,
    city,
    state,
    zipcode,
    monthlyDues,
    email,
    phone,
  })
    .then(() => {
      res.send(201);
    })
    .catch((error) => {
      console.error(error);
    });
});

// Delete a Homeowner

app.delete('/api/removeHomeowner', (req, res) => {
  const { id } = req.body;
  models.Homeowners.destroy({
    where: {
      id,
    },
  })
    .then(() => {
      res.sendStatus(204);
    })
    .catch((error) => {
      console.error(error);
    });
});

// Update a Homeowner

app.post('/api/updateHomeowner', (req, res) => {
  const {
    firstName, lastName, address, city, state, zipcode, monthlyDues, email, phone, id,
  } = req.body;
  models.Homeowners.update({
    firstName,
    lastName,
    fullName: `${req.body.lastName}, ${req.body.firstName}`,
    address,
    city,
    state,
    zipcode,
    monthlyDues,
    email,
    phone,
  }, {
    where: {
      id,
    },
  })
    .then(() => {
      res.sendStatus(204);
    })
    .catch((error) => {
      console.error(error);
    });
});

// Get ALL HomeOwners
app.get('/api/getHomeowners', (req, res) => {
  const { hoaId } = req.body;
  models.Homeowners.findAll({
    where: {
      hoaId,
    },
  })
    .then((homeowners) => {
      res.send(homeowners);
    })
    .catch((error) => {
      console.error(error);
    });
});

// Get a Homeowners current balance
// app.post();

//* ****************************
// STAFF
//* ****************************

// Add a Staff Person
app.post('/api/addStaff', (req, res) => {
  const {
    hoaId, department, firstName, lastName, phone, email,
  } = req.body;
  models.Staff.create({
    hoaId,
    department,
    firstName,
    lastName,
    fullName: `${req.body.lastName}, ${req.body.firstName}`,
    phone,
    email,
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
  const { hoaId } = req.body;
  models.Staff.findAll({
    where: {
      hoaId,
    },
  })
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
  const {
    hoaId, title, description, assignedTo,
  } = req.body;
  models.WorkTickets.create({
    hoaId,
    title,
    description,
    assignedTo,
  })
    .then(() => {
      res.send(201);
    })
    .catch((error) => {
      console.error(error);
    });
});

// Get Open Tickets
app.get('/api/getOpenTickets', (req, res) => {
  const { hoaId } = req.body;
  models.WorkTickets.findAll({
    isOpen: 1,
    hoaId,
  })
    .then((openTickets) => {
      res.send(openTickets);
    })
    .catch((error) => {
      console.error(error);
    });
});

// Get All Tickets
app.get('/api/getAllTickets', (req, res) => {
  const { hoaId } = req.body;
  models.WorkTickets.findAll({
    where: {
      hoaId,
    },
  })
    .then((allTickets) => {
      res.send(allTickets);
    })
    .catch((error) => {
      console.error(error);
    });
});

// Close a Work Ticket
app.post('/api/closeWorkTicket', (req, res) => {
  models.WorkTickets.update({
    isOpen: 0,
    dateCompleted: models.sequelize.literal('CURRENT_TIMESTAMP'),
  }, {
    where: {
      id: req.body.id,
    },
  })
    .then(() => {
      res.send(204);
    })
    .catch((error) => {
      console.error(error);
    });
});

//* ****************************
// BOARD MEMBERS
//* ****************************

// Add a Board Member
app.post('/api/addBoardMember', (req, res) => {
  const {
    hoaId, position, id,
  } = req.body;
  models.BoardMembers.create({
    accountId: id,
    hoaId,
    position,
  })
    .then(() => {
      models.Homeowners.update({
        isBoardMember: 1,
      }, {
        where: {
          id,
        },
      });
    })
    .then(() => {
      res.send(204);
    })
    .catch((error) => {
      console.error(error);
    });
});


// Delete a Board Member
app.post('/api/deleteBoardMember', (req, res) => {
  const { accountId, id } = req.body;
  models.Homeowners.update({
    isBoardMember: 0,
  }, {
    where: {
      id: accountId,
    },
  })
    .then(() => {
      models.BoardMembers.destroy({
        where: {
          id,
        },
      });
    })
    .then(() => {
      res.send(204);
    })
    .catch((error) => {
      console.error(error);
    });
});

// force requests to client files
app.get('*', (req, res) => {
  res.sendFile(path.resolve(`${__dirname}/../client/dist/index.html`));
});


const port = process.env.port || 3000;
app.listen(port, () => {
  console.log(`you servin on port ${port}`);
});
