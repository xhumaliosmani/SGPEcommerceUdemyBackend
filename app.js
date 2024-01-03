const express = require('express');
const app = express();
const dotenv = require('dotenv').config();
const PORT = 5000;
const mongoose = require("mongoose");
const cookieparser = require('cookie-parser');
const cors = require('cors');
const userRoutes = require('./routes/users/usersRoutes.js')
const productRoutes = require('./routes/products/productRoutes.js')
const emailrouter = require("./routes/emailRoutes/emailRoutes.js")

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieparser());

app.use(cors({origin: true, credentials: true}));

app.get('/', (req,res)=> {
    res.send("Hello World!")
});

app.use("/api/users", userRoutes)
app.use("/api/products", productRoutes);
app.use("/api/email", emailrouter);

//connect to the database mongodb
const dbconnection = async () => {
  try {
    await mongoose.connect(process.env.APP_MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB Connected...");
  } catch (error) {
    console.log(error);
  }
};

dbconnection();

app.listen(process.env.PORT || 5000, ()=> {
    console.log(`Server is running on port: ${PORT}`);
});