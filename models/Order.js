const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    Date: { type: Date, required: true },
    Agent: { type: String, required: true },
    Firm_Name: { type: String, required: true },
    Quality: { type: String, required: true },
    Quantity: { type: Number, required: true },
    Rate: { type: Number, required: true },
    Transport: { type: String, required: true },
    Remark: { type: String, required: false },
    PO_Number: { type: String, required: true },
});

module.exports = mongoose.model('Order', orderSchema);