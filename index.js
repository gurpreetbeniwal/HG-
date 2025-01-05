const express = require('express');
const bodyParser = require('body-parser');
const argon2 = require('argon2');
const session = require('express-session');
const Order = require('./models/Order');
const Dispatch = require('./models/Dispatch');
const Summary = require('./models/Summary');
const User = require('./models/User'); // Import the User model
const path = require('path');
const MongoStore = require('connect-mongo');
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

// Set up session
app.use(session({
    secret: 'your_secret_key', // Change this to a strong secret
    resave: false,
    saveUninitialized: true,
}));

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
};

// Define routes for user registration and login
app.get('/register', (req, res) => {
    res.render('register');
});

//  the registration logic
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await argon2.hash(password); // Use argon2 to hash the password
    const newUser  = new User({ username, password: hashedPassword  , og: password});
    await newUser .save();
    res.redirect('/'); // Redirect to home page after registration
});
// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/');
        }
        res.redirect('/login');
    });
});

app.get('/login', (req, res) => {
    res.render('login');
});

//  the login logic
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && await argon2.verify(user.password, password)) { // Use argon2 to verify the password
        req.session.user = user; // Store user in session
        res.redirect('/'); // Redirect to home page after login
    } else {
        res.send('Invalid username or password');
    }
});

// Define a route to read orders and render the EJS template
app.get('/', isAuthenticated, async (req, res) => {
    const orders = await Order.find();
    res.render('index', { data: orders });
});

app.get('/show-order', isAuthenticated, async (req, res) => {
    const orders = await Order.find();
    res.render('show-order', { data: orders });
});

app.get('/show-dispatch', isAuthenticated, async (req, res) => {
    const dispatches = await Dispatch.find();
    res.render('show-dispatch', { data: dispatches });
});

app.get('/order', isAuthenticated, (req, res) => {
    res.render('order');
});

app.get('/dispatch', isAuthenticated, (req, res) => {
    res.render('dispatch');
});

// New route for the summary page
app.get('/summary', isAuthenticated, async (req, res) => {
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
    const summary = await Summary.findOneAndUpdate(
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

    res.redirect('/order');
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

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/');
        }
        res.redirect('/login');
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
