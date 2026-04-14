const dotenv = require("dotenv");
const mongoose = require("mongoose");
const app = require("./app");

dotenv.config();

mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log("DB Connected");
  })
  .catch((err) => {
    console.log("Error in connecting DB", err);
  });

app.listen(process.env.PORT, () => {
  console.log(`Server is running on ${process.env.PORT}`);
});