
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb+srv://pulkit:pulkitHG70@cluster0.nbuqp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'); // Remove deprecated options
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

module.exports = connectDB;