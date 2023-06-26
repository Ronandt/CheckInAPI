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


app.get("/api/getRecords/:accessKey", async (req, res) => {
  var user = await User.findOne({accessKey: req.params.accessKey})
  console.log("AA" + JSON.stringify(user))
  if(user) {
    var allEntries = await CheckInOutSession.find({user: user._id})
    console.log(user._id)
    console.log(allEntries)
    var userCreated = user.createdAt.toLocaleDateString()
    console.log(userCreated)
    var date = new Date(Date.now()).toLocaleString().split(',')[0]
    console.log(date)
    // Convert the dates to JavaScript Date objects
var firstDate = new Date(date);
var secondDate = new Date(userCreated);
console.log(firstDate)
console.log(secondDate)
// Calculate the time difference in milliseconds
var timeDiff = Math.abs(firstDate - secondDate);
console.log(timeDiff)
// Calculate the number of weeks
var weeks = Math.ceil(timeDiff / (1000 * 60 * 60 * 24 * 7));
console.log(weeks)
var weeks_nums = [...Array(weeks + 1).keys()]
var data = []
console.log(weeks_nums + "FOFSFOPFK")
for(var o of weeks_nums) {
  var newDate = new Date(secondDate);
newDate.setDate(secondDate.getDate() + ((o+1) * 7) -2);
var realDate = (new Date(secondDate))
 realDate.setDate(secondDate.getDate() + ((o) * 7) -2)s console.log("NEWDATE" + newDate)
console.log("HHHHH")
var weeks_info = {"week_num": o}
var days = []
for(var x of allEntries) {
  var dateParts = x.date.split("/");

  // month is 0-based, that's why we need dataParts[1] - 1
  var dateObject = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0]); 


  console.log(dateObject) 
  console.log(newDate >= dateObject)
  console.log(dateObject >= realDate)
  if(newDate >= dateObject && dateObject >= realDate  ) {
    days.push({"entry_id": x._id, "date": x.date, "time_in": x.checkIn, "time_out": x?.checkOut ?? 0})
    
  }
}
//implement multiple weeks

weeks_info["days"] = days
data.push(weeks_info)

console.log(JSON.stringify(data))
}


    return res.json({"status": "success", "result": {
      "data": data
    }})
  } else {
    return res.json({"status": "error", "result": {"message": "Invalid Access Key or Key has expired"}})
  }
})


app.post("/api/deleteEntry", async (req,res) => {
let user = await User.findOne({accessKey: req.body.accesskey})
console.log(JSON.stringify(user))
if(user) {
  let entry = await CheckInOutSession.findByIdAndDelete(req.body.entry_id)
  console.log(entry)


}
return res.json({
  "status": "success",
  "result": {
    "message": "Delete completed"
  }
})




})

app.post("/api/editEntry", async(req, res) => {
  let user = await User.findOne({accessKey: req.body.accesskey})
  if(user) {
    var records = await CheckInOutSession.findById(req.body.entry_id)
    records.date = req.body.date
    records.checkIn = req.body.time_in
    records.checkOut = req.body.time_out
    await records.save()
  }
  return res.json({"status": "success",
"result": {
  "message": "Update completed"
}})
})



app.listen(port, () => {
    console.log("App listening at 3000")
})

