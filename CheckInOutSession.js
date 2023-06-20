const { Long } = require("mongodb")
const mongoose = require("mongoose")
const checkInOutSessionSchema = new mongoose.Schema({
checkIn: Number,
date: String,
checkOut: Number,
user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
}, 


}, {timestamps: true})
module.exports = mongoose.models.CheckInOutSessionSchema || mongoose.model("CheckInOutSessionSchema", checkInOutSessionSchema) 