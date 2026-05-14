import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add name"],
    trim: true,
  },

  email: {
    type: String,
    required: [true, "Please add an email"],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please add a valid email",
    ],
  },

  password: {
    type: String,
    required: [true, "Please add password"],
    minlength: 8,
    select: false,
  },

  ownedDocuments: {
    type: String,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// encryption middleware for the password
userSchema.pre("save", async function (next) {
  // if the password is not modified then skip this step
  if (!this.isModified("password")) {
    next();
  }

  //   generating the salt for the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// match password by comparing the current password with the store password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("userHistory", userSchema);

export default User;
