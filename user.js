const mongoose = require("mongoose")
const userSchema = new mongoose.Schema({
username: String,
password: String,
organisation: String,
email: String,
accessKey: String,



}, {timestamps: true})
module.exports = mongoose.models.User || mongoose.model("User", userSchema) 