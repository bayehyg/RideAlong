const mongoose = require('mongoose');

const mongoDB = 'mongodb://your_username:your_password@your_host:your_port/your_database';

// Connect to MongoDB
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });


const db = mongoose.connection;


db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Define a schema for ride orders
const Schema = mongoose.Schema;

const RideOrderSchema = new Schema({
    riderName: String,
    destination: String,
    pickupLocation: String,
    rideStatus: String,
    createdAt: { type: Date, default: Date.now }
});

// Compile model from schema
const RideOrder = mongoose.model('RideOrder', RideOrderSchema);

// Function to get all ride orders
const getRideOrders = async () => {
    try {
        const rideOrders = await RideOrder.find();
        console.log('Ride Orders:', rideOrders);
    } catch (error) {
        console.error('Error fetching ride orders:', error);
    } finally {
        // Close the connection when done
        mongoose.connection.close();
    }
};


getRideOrders();
