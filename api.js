const express = require("express")
const mongoose = require("mongoose")
const User = require("./user")
const user = require("./user")
const CheckInOutSession = require("./CheckInOutSession")

const app = express()
const port = 3000
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
mongoose.connect("mongodb://localhost:27017/checkin")


try {
  const asyncstuff = async () => await User.findOne({ email: "janeteo@gmail.com" });
  asyncstuff().then((result) => {
    if (!result) {
      const createAsync = async () => {
        const createdUser = await User.create({
          username: "jane teo",
          password: "testing",
          email: "janeteo@gmail.com",
          organisation: "NYP",
          accessKey: "123"
        });
        console.log('Item prepopulated:', createdUser);
      };
      createAsync();
    }
  }).catch((error) => {
    console.error('Error prepopulating item:', error);
  });
} catch (error) {
  console.error('Error prepopulating item:', error);
}



app.post("/api/wss/userLogin", async (req,res) => {
  console.log("HIHIHI")
  if(!await User.findOne({email: req.body.email ?? ""})) {
    console.log("USER DOES NOT EXIST")
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
  } else if(!await User.findOne({accessKey: req.body.accesskey ?? ""})) {
 
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
    
  }
  else if(user.accessKey != req.body.accesskey) {
    return res.json({"status": "error", "result": {
      "message": "Invalid Access Key or Key Has Expired."
    }})
  } else if(user.password !== req.body.oldpwd) {
    return res.json({"status": "error", "result" : {
      "message": "Old Password Incorrect. Unable to proceed with password change"
    }})
  }  else {
    user.password = req.body.newpwd
    await user.save()
    console.log("Updated successfully")
    return res.json({"status": "success", "result": {
      "message": "Password updated successfully."
    }})
  }
})

app.post("/api/wss/updateProfileDetails", async (req, res) => {
  console.log(req.body)
  const user = await User.findById(req.body.accountid)
  if(req.body.accessKey !== user?.accessKey) {
    return res.json({
      "status": "error",
      "result": {
        "message": "Invalid Access Key or Key Has Expired."
      }
    })
  } else {
    user.organisation = req.body.organisation
    user.email = req.body.email
    user.username = req.body.username
    await user.save()
    return res.json({
      "status": "success",
      "result": {
        "message": "Details updated successfully."
      }
    })
  }
})

app.post("/api/wss/getProfileDetails", async (req, res) => {
  const user = await User.findById(req.body.accountid)
  if(!user) {
    return res.json({"status": "error",
  "result": {
    "message": "User not found"
  }})
  } 

  return res.json({"status": "success", "result": {
    "accountid": user._id,
    "username": user.username,
    "password": user.password,
    "organisation": user.organisation,
    "email":user.email
  }})


})
app.get("/api/getCheckedInDetails", async(req, res) => {

  let user = await User.findOne({accessKey: req.query.accesskey})
  if(!user) {
    console.log("access key has expired")
    return res.json({
      "status": "error",
      "result": {
      "message": "Invalid Access Key or Key Has Expired"
      }
    })

  } else {
    var latestEntry = (await CheckInOutSession.find({ user: user._id })
.sort({ createdAt: -1 })
.limit(1))[0];

var secondLastEntry =  (await CheckInOutSession.find({ user: user._id })
.sort({ createdAt: -1 }).skip(1)
.limit(1))[0];

console.log("AAAA" +await CheckInOutSession.find({ user: user._id })
.sort({ createdAt: -1 })
.limit(1))


console.log(latestEntry)
console.log(secondLastEntry)
let lastCheckedOut
let lastCheckedIn
let lastCheckedOutDate
let lastCheckedInDate
if(latestEntry?.checkOut) {
  lastCheckedOut =  latestEntry.checkOut
  lastCheckedOutDate = latestEntry.date
} else if (secondLastEntry?.checkOut){
  lastCheckedOut = secondLastEntry.checkOut
  lastCheckedOutDate = secondLastEntry.date
} else {
  lastCheckedOut = ""
  lastCheckedOutDate = ""
}

if(latestEntry?.checkIn) {
  lastCheckedIn = latestEntry?.checkIn
  lastCheckedInDate = latestEntry?.date
} else {
  lastCheckedIn = ""
  lastCheckedInDate = ""
}
console.log(lastCheckedIn)
console.log(lastCheckedInDate)
console.log(lastCheckedOut)
console.log(lastCheckedOutDate)


    return res.json({
      "status": "success",
      "result": {
      "data": [
        {
          "last_checked_in": [
            {
              "date":  lastCheckedInDate,
              "time": lastCheckedIn
            }
          ]
        },
        {
          "last_checked_out": [
            {
              "date": lastCheckedOutDate,
              "time": lastCheckedOut
            }
          ]
        }
      ]}
    })
  }
})

app.post("/api/checkin", async (req, res) => {
  let user = await User.findOne({accessKey: req.body.accesskey})
  console.log(user)
  console.log(req.body)
  var latestEntry = await CheckInOutSession.find({ user : user._id })
  .sort({ createdAt: -1 })
  .limit(1)[0];
  console.log("HIHIHIHI")
  console.log(latestEntry)
  
  if(!latestEntry?.checkIn) {
    if(user) {
      const singaporeOffset = 8 * 60 * 60 * 1000; // Singapore is 8 hours ahead of UTC
  const singaporeTime = new Date(Date.now());
  const formattedDate = singaporeTime.toLocaleDateString('en-SG');
  
  console.log(formattedDate);
  console.log("CHECK IN DONE")
      var checkInOutSession = await CheckInOutSession.create({date: formattedDate, checkIn: Date.now(), user: user._id})
    
    }
  }

  return res.json({"status": "success", "result": {
    "message": "Check in completed"
  }})
})

app.post("/api/checkout", async (req, res) => {
  console.log("HIHIHIH")
  let user = await User.findOne({accessKey: req.body.accesskey})
  if(user) {
    console.log("QAAAAAAAA")
    const singaporeOffset = 8 * 60 * 60 * 1000; // Singapore is 8 hours ahead of UTC
const singaporeTime = new Date(Date.now());
const formattedDate = singaporeTime.toLocaleDateString('en-SG');

console.log(formattedDate);
var latestEntry = (await CheckInOutSession.find({user: user._id}).sort({createdAt: -1}).limit(1))[0]
if(latestEntry){
  latestEntry.checkOut = Date.now()
  latestEntry.save()
}

  
  }
  return res.json({"status": "success", "result": {
    "message": "Check out completed"
  }})
})

app.listen(port, () => {
    console.log("App listening at 3000")
})

