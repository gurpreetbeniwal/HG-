const mongoose = require('mongoose');

const summarySchema = new mongoose.Schema({
    Agent: { type: String, required: true },
    Firm_Name: { type: String, required: true },
    Quality: { type: String, required: true },
    Rate: { type: Number, required: true },
    totalOrders: { type: Number, default: 0 },
    totalDispatches: { type: Number, default: 0 },
    pendingOrders: { type: Number, default: 0 },
    totalOrderQuantity: { type: Number, default: 0 }, // New field for total order quantity
    totalDispatchQuantity: { type: Number, default: 0 }, // New field for total dispatch quantity
});

module.exports = mongoose.model('Summary', summarySchema);