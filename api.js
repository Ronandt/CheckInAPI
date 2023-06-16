const express = require("express")
const mongoose = require("mongoose")
const User = require("./user")
const user = require("./user")
const app = express()
const port = 3000
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
mongoose.connect("mongodb://localhost:27017/checkin")


try {
  const result = async () => await User.create({username: "jane teo", password: "testing", email:"janeteo@gmail.com", organisation:"NYP", accessKey: "123"});
  result()
  console.log('Item prepopulated:', result);
} catch (error) {
  console.error('Error prepopulating item:', error);
}


app.post("/api/wss/userLogin", async (req,res) => {
  if(!await User.findOne({email: req.body.email ?? ""})) {
    res.json({
      "status": "error",
      "result": {
        "message": "User does not exist."
      }
    })
    
    return
  } else if(!await User.findOne({password: req.body.password ?? ""})) {
    res.json({
      "status": "error",
      "result": {
        "message": "Incorrect Password."
      }
    })
  } else if(!await User.findOne({accessKey: req.body.accessKey ?? ""})) {
    res.json({
      "status": "error",
      "result": {
        "message": "Invalid Access Key or Key Has Expired."
      }
     
    })
  } else {
    const user = await User.findOne({email: req.body.email ?? ""})
    res.json({
      "status": "success",
      "result": {
        "accountid": user._id,
        "email": user.email,
        "orgid": user.organisation
      }
    })
  }
})

app.post("api/wss/changePassword", async (req, res) => {
  const user = await User.findById(req.body.accountid)
  if(req.body.cnfmpwd !== req.body.newpwd) {
    res.json({})
  }
})

app.listen(port, () => {
    console.log("App listening at 3000")
})