const express = require('express');
const bodyParser = require('body-parser');
const Order = require('./models/Order');
const Dispatch = require('./models/Dispatch');
const Summary = require('./models/Summary');
const path = require('path');
const connectDB = require('./db'); // Import the connectDB function

const app = express();
const port = 3000;

// Connect to MongoDB
connectDB();

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to parse URL-encoded data
app.use(bodyParser.urlencoded({ extended: true }));

// Define a route to read orders and render the EJS template
app.get('/', async (req, res) => {
    const orders = await Order.find();
    res.render('index', { data: orders });
});

app.get('/show-order', async (req, res) => {
    const orders = await Order.find();
    res.render('show-order', { data: orders });
});

app.get('/show-dispatch', async (req, res) => {
    const dispatches = await Dispatch.find();
    res.render('show-dispatch', { data: dispatches });
});

app.get('/order', (req, res) => {
    res.render('order');
});

app.get('/dispatch', (req, res) => {
    res.render('dispatch');
});

// New route for the summary page
app.get('/summary', async (req, res) => {
    const summaries = await Summary.find();
    res.render('summary', { data: summaries });
});

// Define a route to handle form submission for adding a new order
app.post('/add-order', async (req, res) => {
    const newOrder = new Order({
        Date: req.body.attribute1,
        Agent: req.body.attribute2,
        Firm_Name: req.body.attribute3,
        Quality: req.body.attribute4,
        Quantity: req.body.attribute5,
        Rate: req.body.attribute6,
        Transport: req.body.attribute7,
        Remark: req.body.attribute8,
        PO_Number: req.body.attribute9,
    });

    await newOrder.save();

    // Update summary
    await Summary.findOneAndUpdate(
        {
            Agent: req.body.attribute2,
            Firm_Name: req.body.attribute3,
            Quality: req.body.attribute4,
            Rate: req.body.attribute6,
        },
        {
            $inc: {
                totalOrders: 1,
                pendingOrders: 1,
                totalOrderQuantity: req.body.attribute5, // Increment total order quantity
            },
            $setOnInsert: {
                Agent: req.body.attribute2,
                Firm_Name: req.body.attribute3,
                Quality: req.body.attribute4,
                Rate: req.body.attribute6,
            },
        },
        { upsert: true, new: true }
    );

    res.redirect('/');
});

// Define a route to handle form submission for adding a new dispatch
app.post('/add-dispatch', async (req, res) => {
    const newDispatch = new Dispatch({
        Date: req.body.attribute1,
        Agent: req.body.attribute2,
        Firm_Name: req.body.attribute3,
        Quality: req.body.attribute4,
        Quantity: -req.body.attribute5,
        Rate: +req.body.attribute6,
        Transport: req.body.attribute7,
        Remark: req.body.attribute8,
        PO_Number: req.body.attribute9,
    });

    await newDispatch.save();

    // Check if the corresponding summary entry exists
    const summary = await Summary.findOne({
        Agent: req.body.attribute2,
        Firm_Name: req.body.attribute3,
        Quality: req.body.attribute4,
        Rate: req.body.attribute6,
    });

    if (summary) {
        // Update summary if it exists
        await Summary.findOneAndUpdate(
            {
                Agent: req.body.attribute2,
                Firm_Name: req.body.attribute3,
                Quality: req.body.attribute4,
                Rate: req.body.attribute6,
            },
            {
                $inc: {
                    totalDispatches: 1,
                    pendingOrders: -1,
                    totalDispatchQuantity: req.body.attribute5, // Increment total dispatch quantity
                },
            },
            { new: true }
        );
        res.redirect('/dispatch');
    } else {
        // If summary does not exist, send a warning message
        res.status(200).send("<h1> ORDER does not exist, but dispatch made.</h1> <a href='/'>Back to home page</a>");
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost :${port}`);
});