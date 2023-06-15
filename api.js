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
  const result = await User.create({username: "jane teo", password: "testing", email:"janeteo@gmail.com", organisation:"NYP", accessKey: "123"});

  console.log('Item prepopulated:', result);
} catch (error) {
  console.error('Error prepopulating item:', error);
}


app.post("/api/wss/userLogin", async (req,res) => {
  if(!await User.findOne({email: req.body.email ?? ""})) {
    return res.json({
      "status": "error",
      "result": {
        "message": "User does not exist."
      }
    })
    
  } else if(!await User.findOne({password: req.body.password ?? ""})) {
    return res.json({
      "status": "error",
      "result": {
        "message": "Incorrect Password."
      }
    })
  } else if(!await User.findOne({accessKey: req.body.accessKey ?? ""})) {
    return res.json({
      "status": "error",
      "result": {
        "message": "Invalid Access Key or Key Has Expired."
      }
     
    })
  } else {
    const user = await User.findOne({email: req.body.email ?? ""})
    return res.json({
      "status": "success",
      "result": {
        "accountid": user._id,
        "email": user.email,
        "orgid": user.organisation
      }
    })
  }
})

app.post("/api/wss/changePassword", async (req, res) => {
  const user = await User.findById(req.body.accountid)
  if(req.body.cnfmpwd !== req.body.newpwd) {
    return res.json({"status": "error", "result": {
      "message": "Passwords do not match"
    }})
  } else if(user.password !== req.body.oldpwd) {
    return res.json({"status": "error", "result" : {
      "message": "Old Password Incorrect. Unable to proceed with password change"
    }})
  } else if(user.accessKey != req.body.accessKey) {
    return res.json({"status": "error", "result": {
      "message": "Invalid Access Key or Key Has Expired."
    }})
  } else {

    return res.json({"status": "success", "result": {
      "message": "Passwoord updated successfully."
    }})
  }
})

app.post("/api/wss/updateProfileDetails", (req, res) => {
  const user = await User.findById(req.body.accountid)
  if(req.body.accessKey !== user.accessKey) {
    return res.json({
      "status": "error",
      "result": {
        "message": "Invalid Access Key or Key Has Expired."
      }
    })
  } else {

    return res.json({
      "status": "success",
      "result": {
        "message": "Details updated successfully."
      }
    })
  }
})

app.get("/api/wss/getProfileDetails", (req, res) => {
  const user = await User.findById(req.body.accountid)
  if(!user) {
    return res.json({"status": "error",
  "result": {
    "message": "User not found"
  }})
  } 

  return res.json({"status": "success", "result": {
    "accountid": {}
  }})


})

app.listen(port, () => {
    console.log("App listening at 3000")
})